# Minimal ELK Stack with Node Server Logs

## Prerequisites

Before starting, make sure your system has the following installed:

* Docker
* Docker Compose
* Node.js (v14+ recommended)
* npm
* A modern browser for Kibana (Chrome, Firefox, etc.)

This setup assumes a Unix-like environment (Linux/macOS) or Windows with WSL2.

## Project Overview

This project simulates an enterprise logging stack using Docker for Elasticsearch, Kibana, and Filebeat, alongside a Node.js server that generates logs similar to a Java enterprise application. The workflow demonstrates how logs are collected, processed, and visualized in Kibana, using an ingest pipeline to structure the log data.

## Project Structure

```
project-root/
│
├── docker-compose.yml      # Defines Elasticsearch, Kibana, and Filebeat services
├── filebeat.yml            # Configures Filebeat inputs and output
└── server/                 # Node server application
    ├── package.json
    ├── index.js            # Server code
    └── logs/               # Folder where logs are written
```

* The Node server resides in the `server/` folder.
* Filebeat reads logs from `server/logs`.
* Docker Compose defines all service configurations and volume mounts.

## Step 1: Setting Up the Node Server

1. Navigate to the `server/` folder and initialize npm:

```
npm init -y
```

2. In `package.json`, set `type` to `module`:

```json
"type": "module"
```

3. Create `index.js` to generate logs in a Java-like format:

```
2025-10-04 14:20:05,456 INFO [com.example.MyService] - Handled GET /
```

* Ensure logs are written to `logs/server.log`.
* Include endpoints like `/error` to simulate error logs.

4. Start the server:

```
nodemon index.js
```

* Confirm logs are being written.

## Step 2: Docker Compose Setup

Create `docker-compose.yml` with services for Elasticsearch, Kibana, and Filebeat. Key points:

* Elasticsearch: port 9200, single-node, memory limits for local testing.
* Kibana: port 5601, points to Elasticsearch.
* Filebeat: mounts `filebeat.yml` and Node logs, runs as root with `--strict.perms=false`.

Make sure volume paths reflect actual folder names. For example, if the server folder is `server/`:

```
./server/logs:/logs:ro
```
<img width="859" height="138" alt="Screenshot 2025-10-04 at 11 31 21 AM" src="https://github.com/user-attachments/assets/738877ce-eda7-4aac-a79c-4948005d5354" />


## Step 3: Filebeat Configuration

`filebeat.yml` example:

```yaml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /logs/*.log

output.elasticsearch:
  hosts: ["http://elasticsearch:9200"]
  pipeline: "parse-java-logs"
```

* `paths` must match the mount inside the container.
* `pipeline` must match the ingest pipeline in Elasticsearch.

## Step 4: Ingest Pipeline

An ingest pipeline in Elasticsearch takes raw logs and processes them before storing. It can extract structured information from unstructured log messages (like timestamp, log level, or class name), modify fields, or remove unnecessary data. Essentially, it transforms messy log lines into clean, structured documents that are easy to search, filter, and visualize in Kibana.

Create the pipeline in Kibana Dev Tools:

```bash
PUT _ingest/pipeline/parse-java-logs
{
  "description": "Parse server logs",
  "processors": [
    {
      "grok": {
        "field": "message",
        "patterns": [
          "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} +\\[%{DATA:class}\\] - %{GREEDYDATA:log_message}"
        ]
      }
    },
    {
      "remove": {
        "field": "host"
      }
    }
  ]
}
```
<img width="1917" height="441" alt="Screenshot 2025-10-04 at 11 37 58 AM" src="https://github.com/user-attachments/assets/a7268ae1-063e-47d3-bb24-3503bb00d253" />


## Step 5: Starting Docker Services

Bring up the stack:

```
docker compose up 
```

* Wait a few seconds for services to be ready.
* Generate logs using:

```
curl http://localhost:3000/
curl http://localhost:3000/error
```

* OR you can use Postman.

## Step 6: Verifying Logs in Elasticsearch

Check indices:

```
GET _cat/indices?v
```

* Initially, you may only see internal indices.
* After Filebeat ships logs, you should see something like `.ds-filebeat-8.15.3-2025.10.04-000001`.
* `docs.count` indicates the number of log events ingested.

## Step 7: Viewing Logs in Kibana

1. Go to Kibana → Stack Management → Data → Data Views.
2. Create a new Data View with pattern `filebeat*`.
<img width="1441" height="775" alt="Screenshot 2025-10-04 at 12 00 54 PM" src="https://github.com/user-attachments/assets/35b16d28-2440-46d3-b64a-5d9b21c8261d" />
3. Go to Discover:

* Select your Data View.
* You will see structured logs.
* Apply filters using Kibana Query Language (KQL) as needed.
  
<img width="1909" height="835" alt="Screenshot 2025-10-04 at 12 05 00 PM" src="https://github.com/user-attachments/assets/c0e6801d-08fe-44f2-8b73-b14b04557c16" />

<img width="548" height="776" alt="Screenshot 2025-10-04 at 12 33 14 PM" src="https://github.com/user-attachments/assets/70bd0abf-e4d2-4391-922e-c9053c80aa2f" />

## Step 8: Debugging Tips

* Filebeat `status=400` errors usually mean the pipeline does not exist or logs don’t match grok.
* Confirm pipeline exists:

```
GET _ingest/pipeline?pretty
```

* Simulate a log through the pipeline:

```bash
POST _ingest/pipeline/parse-java-logs/_simulate
{
  "docs": [
    {
      "_source": {
        "message": "2025-10-04 14:20:05,456 INFO [com.example.MyService] - Handled GET /"
      }
    }
  ]
}
```

* Check volume mounts and log file paths.
* Ensure grok pattern matches exactly.

## Notes

* Pipeline names in `filebeat.yml` must exactly match Elasticsearch pipelines.
* `.ds-filebeat-*` indices are auto-generated by Filebeat.
* Yellow health is normal for single-node Elasticsearch.
* This setup mimics enterprise logging stack flow, only simpler.
* Docker allows testing without multiple VMs or Kubernetes.

## Conclusion

This project demonstrates the full workflow:

* Node server generates logs.
* Filebeat collects logs and sends them to Elasticsearch.
* Ingest pipeline structures logs.
* Kibana visualizes logs for monitoring and analysis.

This minimal setup prepares you to understand and work with enterprise ELK stacks.
