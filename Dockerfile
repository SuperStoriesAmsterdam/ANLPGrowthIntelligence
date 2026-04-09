FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY CT_Growth_Intelligence.html /usr/share/nginx/html/index.html
COPY js/ /usr/share/nginx/html/js/
EXPOSE 3000
