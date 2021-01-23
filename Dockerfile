FROM gcr.io/feisty-return-300415/pumba-ubi-minimal-node14

WORKDIR /software/
RUN microdnf install yum && \
    mkdir ./rpms4test
COPY . .
RUN npm i

CMD [ "node", "index.js" ]