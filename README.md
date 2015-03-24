senior-project
==============
Deploy the code by running 'sudo ./deploy'
You should not deploy on your development machine because it remove the test packages and starts meteor in the background.

# Docker
If using docker, then first build the image:
```bash
docker build -t timesystem .
```

Then run like the following:
```bash
docker run -it --rm --name=timesystem -p 3000:80 \
    -e REBUILD_NPM_MODULES=1 \
    -e MONGO_URL=mongodb://mongo_server_ip:27017/timesystem \
    -e ROOT_URL=http://ip_addr_of_host_server:3000/ \
    -e METEOR_SETTINGS="$(cat settings.json)" \
    timesystem
```

Replacing mongo_server_ip with the address of the mongo server and replacing
ip_addr_of_host_server with the ip address or FQDN of the host server.
