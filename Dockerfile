FROM ubuntu:18.04

# Update packages and install curl
RUN apt-get update && apt-get -y upgrade
RUN apt-get install -y curl

ENV NVM_DIR "/root/.nvm"

# Copy and install the application
WORKDIR /root/secure-microservice-pattern
COPY . .

# Install node
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.2/install.sh | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install 8.4 \
    && npm install

EXPOSE 3000

CMD ["/root/.nvm/versions/node/v8.4.0/bin/node", "bin/www"]
