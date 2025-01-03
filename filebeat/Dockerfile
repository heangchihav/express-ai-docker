FROM docker.elastic.co/beats/filebeat:8.11.1

USER root

# Copy configuration
COPY ./config/filebeat.yml /usr/share/filebeat/filebeat.yml

# Adjust permissions
RUN chmod go-w /usr/share/filebeat/filebeat.yml

# Optional: Debug step to verify permissions during build
RUN ls -l /usr/share/filebeat/filebeat.yml
