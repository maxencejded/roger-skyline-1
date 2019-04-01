server {
	listen 443 ssl;
	listen [::]:443 ssl;
	include snippets/self-signed.conf;
	include snippets/ssl-params.conf;

	root /var/www/roger-skyline/html;
	index index.html;

	server_name roger-skyline.com www.roger-skyline.com;

	location / {
		try_files $uri $uri/ =404;
	}
}

server {
	listen 80;
	listen [::]:80;

	server_name roger-skyline.com www.roger-skyline.com;

	return 302 https://$server_name$request_uri;
}
