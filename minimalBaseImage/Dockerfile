FROM registry.access.redhat.com/ubi7/ubi-minimal

RUN microdnf install yum && \
    curl -sL https://rpm.nodesource.com/setup_14.x | bash - && \
    yum install -y nodejs-14.15.3 --disablerepo=* --enablerepo=nodesource && \
    microdnf remove yum && \
    microdnf clean all