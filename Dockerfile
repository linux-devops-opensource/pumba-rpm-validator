FROM gcr.io/feisty-return-300415/rhel7.9-node14.15.3:latest

WORKDIR /software/
COPY rhel-7-server-rpms.repo /etc/yum.repos.d/
COPY security ./security/
RUN yum install -y file --disablerepo=* --enablerepo=rhel-7-server-rpms-pumba && \
    yum clean all --enablerepo=* && \
    mkdir ./rpms4test
COPY package.json .
RUN npm i
COPY . .

CMD [ "node", "index.js" ]