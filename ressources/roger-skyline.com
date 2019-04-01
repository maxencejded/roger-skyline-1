server {
	listen 80;
	listen [::]:80;

	root /var/www/roger-skyline/html;
	index index.html;

	server_name roger-skyline.com www.roger-skyline.com;

	location / {
		try_files $uri $uri/ =404;
	}
}
