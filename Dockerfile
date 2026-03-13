# Kan-jibou Node.js sghir o khfif
FROM node:20-alpine

# L-blasa fin ghan-khdmo west l-container
WORKDIR /app

# Kan-copiw ghir package.json lwl bach n-installiw dependencies
COPY package*.json ./
RUN npm install

# Kan-copiw l-code dyalna kaml
COPY . .

# Kan-7ellou l-port 4000
EXPOSE 4000

# L-commande bach y-starti l-serveur (b nodemon)
CMD ["npm", "run", "dev"]