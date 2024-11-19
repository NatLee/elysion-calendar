FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY conf.d/default.conf /etc/nginx/conf.d/
RUN mkdir -p /var/cache/nginx
