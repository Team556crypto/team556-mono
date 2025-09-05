# Use the official Nginx image from Docker Hub
FROM nginx:stable-alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the static build output from the 'dist' directory to Nginx's web root
COPY dist/ /usr/share/nginx/html

# Copy a custom Nginx configuration (we'll create this if needed, but start without)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
