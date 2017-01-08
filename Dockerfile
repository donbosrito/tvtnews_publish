FROM node:6

MAINTAINER Le Bang Tu <donbosrito>

# Create app directory
RUN mkdir -p /tvtnews-server
WORKDIR /tvtnews-server

# Install app dependencies
COPY package.json /tvtnews-server
RUN npm install

# Bundle app source
COPY . /tvtnews-server

EXPOSE 3000
CMD [ "npm", "start" ]