FROM node:6.3.0

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN npm install

# copy source files
COPY . /app

EXPOSE 8000

CMD node app.js