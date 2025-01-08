FROM docker.elastic.co/beats/filebeat:8.11.1

USER root

# Create necessary directories
RUN mkdir -p /usr/share/filebeat/logs /usr/share/filebeat/certs/ca

# Copy configuration
COPY ./config/filebeat.yml /usr/share/filebeat/filebeat.yml

# Set permissions
RUN chmod go-w /usr/share/filebeat/filebeat.yml && \
    chown root:root /usr/share/filebeat/filebeat.yml && \
    chmod 644 /usr/share/filebeat/filebeat.yml

# Create data directory with proper permissions
RUN mkdir -p /usr/share/filebeat/data && \
    chown -R root:root /usr/share/filebeat/data && \
    chmod -R 0750 /usr/share/filebeat/data

HEALTHCHECK --interval=30s --timeout=3s --start-period=1m CMD filebeat test config && filebeat test output
