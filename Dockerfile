FROM nginx:1-alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY build/client /usr/share/nginx/html
