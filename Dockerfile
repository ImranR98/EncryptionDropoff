FROM ubuntu
RUN apt update
RUN apt install -y software-properties-common
RUN add-apt-repository -y ppa:unit193/encryption
RUN apt -y install veracrypt curl build-essential
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
ENV NVM_DIR="/root/.nvm"
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install node && nvm use node"
ENV NODE_BIN="$NVM_DIR/versions/node/$(ls $NVM_DIR/versions/node)/bin"
COPY . .
RUN bash -c 'source $NVM_DIR/nvm.sh && npm i'
CMD bash -c 'source $NVM_DIR/nvm.sh && npm start'

# docker build -t encryption-dropoff .