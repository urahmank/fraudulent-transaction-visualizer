from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import networkx as nx
from sklearn.ensemble import IsolationForest
import io

app = FastAPI()

# Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update if hosted elsewhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    # Load CSV into DataFrame
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode("utf-8")))

    # Generate dummy sender/receiver
    import numpy as np
    np.random.seed(42)
    df['Sender'] = np.random.randint(1000, 5000, df.shape[0])
    df['Receiver'] = np.random.randint(1000, 5000, df.shape[0])

    # Build graph
    import networkx as nx
    G = nx.Graph()
    for _, row in df.iterrows():
        G.add_edge(row['Sender'], row['Receiver'], weight=row['Amount'], fraud=int(row['Class']))

    # Centrality & PageRank
    degree_centrality = nx.degree_centrality(G)
    pagerank = nx.pagerank(G)
    df['Degree_Centrality'] = df['Sender'].map(degree_centrality)
    df['PageRank'] = df['Sender'].map(pagerank)

    # Anomaly Detection
    from sklearn.ensemble import IsolationForest
    features = ['Amount', 'Degree_Centrality', 'PageRank']
    clf = IsolationForest(contamination=0.01)
    df['Fraud_Prediction'] = clf.fit_predict(df[features])

    # Prepare anomaly pair set
    anomalous_pairs = set(
        tuple(row) for row in df[df['Fraud_Prediction'] == -1][['Sender', 'Receiver']].values
    )
    fraud_pairs = set(
        tuple(row) for row in df[df['Class'] == 1][['Sender', 'Receiver']].values
    )

    # Prepare graph data for frontend
    nodes = [{"id": str(node)} for node in G.nodes()]
    edges = [
        {
            "source": str(u),
            "target": str(v),
            "weight": G[u][v]['weight'],
            "anomaly": (u, v) in anomalous_pairs or (v, u) in anomalous_pairs,
            "fraud": (u, v) in fraud_pairs or (v, u) in fraud_pairs
        }
        for u, v in G.edges()
    ]

    anomalies = df[df['Fraud_Prediction'] == -1][['Sender', 'Receiver', 'Amount']].to_dict(orient="records")

    return {
        "summary": {
            "total_transactions": len(df),
            "fraudulent_transactions": int(df['Class'].sum()),
            "detected_anomalies": len(anomalies)
        },
        "graph": {
            "nodes": nodes,
            "edges": edges
        },
        "anomalies": anomalies
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)