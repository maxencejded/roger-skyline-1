# Roger-Skyline-1
How to configure a linux machine to use it as a web-server

* [Prerequisite](#prerequisite)
* [Create the VM](#create-the-virtual-machine)
* [Install Debian](#install-debian)
* [Find the IP address and connect through SSH](#find-the-ip-address-to-connect-through-ssh)
* [Enable sudo for specific user](#enable-sudo-for-specific-user)
* [Set IP address as static](#set-ip-address-as-static)
* [Configure SSH](#configure-ssh)
* [Setup Firewall](#setup-firewall)
* [Scheduled a Script](#scheduled-a-script)
* [Protect for DOS and Port Scans](#protect-for-dos-and-port-scans)
* [Install and Configure Nginx](#install-and-configure-nginx)

## Prerequisite
You need a VM Hypervisor, [VirtualBox](https://www.virtualbox.org) is the one use in this project.

You will also need a linux distribution, in this project we are allowed to choose the distribution that we want. I decide to use [Debian](https://www.debian.org) for this project.

You can download the iso [here](https://www.debian.org/distrib/netinst), choose`amd64`.

## Create the Virtual Machine
Create a Virtual-Machine
```console
~ ➤ VBoxManage create --name roger-skyline --ostype Debian_64 --register
```
Adapt the VM to Debian
```console
~ ➤ VBoxManage modifyvm roger-skyline --memory 1024 --vram 12
~ ➤ VBoxManage modifyvm roger-skyline --nic1 bridged --bridgeadapter1 en0
```

Show VM infos
```console
~ ➤ VBoxManage showvminfo roger-skyline
```

Create a virtual storage and attach it the the VM
```console
~ ➤ VBoxManage createmedium --filename ./roger-skyline.vdi --size 8192 --variant Standard
~ ➤ VBoxManage storagectl roger-skyline --name "SATA" --add sata --bootable on
~ ➤ VBoxManage storageattach roger-skyline --storagectl "SATA" --port 0 --device 0 --type hdd --medium ./roger-skyline.vdi
```

Mount the Debian iso for installation
```console
~ ➤ VBoxManage storagectl roger-skyline --name "Installation Disk" --add ide
~ ➤ VBoxManage storageattach roger-skyline --storagectl "Installation Disk" --port 1 --device 0 --type dvddrive --medium ~/debian-9.8.0-amd64-netinst.iso
```

Start the VM
```console
~ ➤ VBoxManage startvm roger-skyline
```

## Install Debian
Follow the instruction on the screen

Unmount the installation storage when it's done
```console
~ ➤ VBoxManage storageattach roger-skyline --storagectl "Installation Disk" --port 1  --device 0 --type dvddrive --medium none
```

## Find the IP address and connect through SSH
Start the VM and login with you *login* and *password* then type the following command to get the IP of the VM to connect by SSH
```console
mjacques@roger-skyline $ hostname -I
10.114.254.198
```

Connect to SSH to the VM
```console
~ ➤ ssh mjacques@10.114.254.198
mjacques@roger-skyline $
```

## Enable sudo for specific user
Type the following command when you are on the VM (SSH or direct)
```console
mjacques@roger-skyline $ su
root@roger-skyline $ apt-get update && apt-get upgrade
root@roger-skyline $ apt-get install -y sudo
root@roger-skyline $ usermod -aG sudo $USER
root@roger-skyline $ reboot
```

## Set IP address as static
Find the gateway and the network device
```console
mjacques@roger-skyline $ ip route | grep default # Find the gateway
default via 10.114.254.254 dev enp0s3 onlink
```

Edit the network interface
```console
mjacques@roger-skyline $ sudo vim /etc/network/interfaces
> ...
> # The primary network interface
> allow-hotplug enp0s3
> iface enp0s3 inet dhcp #<--- Remove this line
```

Create a new file and copy the code below inside
```console
mjacques@roger-skyline $ sudo vim /etc/network/interfaces.d/enp0s3
# Static ip address for enp0s3
> iface enp0s3 inet static
>		address 10.114.254.42
>		netmask 255.255.255.252
>		gateway 10.114.254.254
```

Reboot to apply the change
```console
mjacques@roger-skyline $ sudo reboot
```

Try to connect to SSH with the new IP address
```console
~ ➤ ssh mjacques@10.114.254.42
mjacques@roger-skyline $
```

## Configure SSH
Edit the file `/etc/ssh/sshd_config` and add/change the following line
```console
mjacques@roger-skyline $ sudo vim /etc/ssh/sshd_config
> Port 4242
> PermitRootLogin no
> PasswordAuthentication no
> AuthorizedKeysFile .ssh/authorized_keys
mjacques@roger-skyline $ sudo rm /etc/motd
```

Before apply the change you need to create a SSH-RSA key on the host machine and copy the key to your VM
```console
# iMac
~ ➤ ssh-keygen
~ ➤ cat ~/.ssh/id_rsa.pub
ssh-rsa AAAAB3Nza[...]
~ ➤ scp ~/.ssh/id_rsa.pub mjacques@10.114.254.42:/home/mjacques/id_rsa_key
~ ➤ ssh mjacques@10.114.254.42
mjacques@roger-skyline $ mkdir -p ~/.ssh
mjacques@roger-skyline $ sudo mv id_rsa_key ~/.ssh/authorized_keys
mjacques@roger-skyline $ sudo chmod 0644 ~/.ssh/authorized_keys
```

Restart SSH service to apply the change
```console
mjacques@roger-skyline $ sudo systemctl restart ssh
```

## Setup Firewall
The default policy in a default installation is to ACCEPT all traffic. So we need to DROP all the all traffic except the one we are really using.

Copy the content of `ressources/firewall.service` in the VM
```console
mjacques@roger-skyline $ sudo vim /etc/systemd/system/firewall.service
```

Copy the file `ressources/scripts/firewall.sh` in the VM
```console
mjacques@roger-skyline $ mkdir -p /etc/script
mjacques@roger-skyline $ sudo vim /etc/script/firewall.sh
mjacques@roger-skyline $ sudo chomd 0600 /etc/script/firewall.sh
```

Enable and Start the service *firewall.service*
```console
mjacques@roger-skyline $ systemctl enable firewall.service
mjacques@roger-skyline $ systemctl start firewall.service
```

## Scheduled a Script
Copy the file `ressources/scripts/scheduled.sh` in the VM
```console
mjacques@roger-skyline $ mkdir -p /etc/script
mjacques@roger-skyline $ sudo vim /etc/script/scheduled.sh
mjacques@roger-skyline $ sudo chmod 0600 /etc/script/scheduled.sh
```

Create crontab to run it at a specific time
```console
mjacques@roger-skyline $ crontab -e
> 0 4 	* * 1 	root 	/bin/sh /etc/script/scheduled.sh
> @reboot				/bin/sh /etc/script/scheduled.sh
```

## Protect for DOS and Port Scans
Install the following package
```console
mjacques@roger-skyline $ sudo apt-get install -y fail2ban
```

## Send an email to root
Install the package mail and postfixe
```console
mjacques@roger-skyline $ sudo apt-get install -y mailutils postfixe
```
For postfixe, when the setting pop-up, choose local users.

Before everything setup the script, let's run a test for mail
```console
mjacques@roger-skyline $ echo "Hello from roger-skyline" | mailx -s "Test" root
mjacques@roger-skyline $ sudo mailx
[sudo] password for mjacques:
"/var/mail/root": 1 message 1 new
>N   1 Maxence Jacques de Sat Mar 30 22:07  13/486   Test
?
```

Copy the file `ressources/scripts/monitor.sh` in the VM
```console
mjacques@roger-skyline $ mkdir -p /etc/script
mjacques@roger-skyline $ sudo vim /etc/script/monitor.sh
mjacques@roger-skyline $ sudo chmod 0600 /etc/script/monitor.sh
```

Edit crontab to run it at a specific time
```console
mjacques@roger-skyline $ crontab -e
> 0 0 	* * * 	root 	/bin/sh /etc/script/monitor.sh
```

## Install and Configure Nginx
Download the package nginx
```console
mjacques@roger-skyline $ sudo apt install -y nginx
```

Check service nginx status
```console
mjacques@roger-skyline:~$ systemctl status nginx
● nginx.service - A high performance web server and a reverse proxy server
	Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
	Active: active (running) since Sun 2019-03-31 14:36:58 PDT; 40s ago
		Docs: man:nginx(8)
	Process: 1829 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
	Process: 1827 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
	Main PID: 1831 (nginx)
		Tasks: 2 (limit: 4915)
		CGroup: /system.slice/nginx.service
			├─1831 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
			└─1832 nginx: worker process
```

We need the update the firewall to allow the access to HTTP & HTTPS
```console
mjacques@roger-skyline $ sudo vim /etc/script/firewall.sh
> # Allow INPUT for NGINX (HTTP: 80 | HTTPS: 443)
> iptables -A INPUT -p tcp --dport 80 -m state --state NEW -j ACCEPT
> iptables -A INPUT -p tcp --dport 442 -m state --state NEW -j ACCEPT
mjacques@roger-skyline $ sudo systemctl start firewall.service
```

Create a new display site
```console
mjacques@roger-skyline:~$ sudo mkdir -p /var/www/roger-skyline/html
mjacques@roger-skyline:~$ sudo chown -R $USER:$USER /var/www/roger-skyline/html/
mjacques@roger-skyline:~$ sudo chmod -R 0755 /var/www/roger-skyline/
```

Copy the files `ressources/web/index.html` and `ressources/web/scripts.js` in the VM
```console
mjacques@roger-skyline $ sudo vim /var/www/roger-skyline/html/index.html
mjacques@roger-skyline $ sudo vim /var/www/roger-skyline/html/scripts.js
mjacques@roger-skyline $ sudo chmod 0644 /var/www/roger-skyline/html/index.html
mjacques@roger-skyline $ sudo chmod 0644 /var/www/roger-skyline/html/scripts.js
```

### HTTP

Copy the file `ressources/roger-skyline.com` in the VM
```console
mjacques@roger-skyline:~$ sudo vim /etc/nginx/sites-available/roger-skyline
mjacques@roger-skyline:~$ sudo ln -s /etc/nginx/sites-available/roger-skyline /etc/nginx/sites-enabled/
mjacques@roger-skyline:~$ sudo systemctl restart nginx
```

Now you can connect to the webpage by `http://10.114.254.42`


### HTTPS (SSL self-signed)
Create a public key
```console
mjacques@roger-skyline:~$ sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:Fremont
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Roger-Skyline
Organizational Unit Name (eg, section) []:IT
Common Name (e.g. server FQDN or YOUR name) []:10.114.254.42
Email Address []:mjacques@roger-skyline.com
```

Optional create a strong Diffie-Hellman group
```console
mjacques@roger-skyline:~$ sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096
```

Copy the file `ressources/ssl/ssl-signed.conf` in the VM
```console
mjacques@roger-skyline:~$ sudo vim /etc/nginx/snippets/self-signed.conf
```

Copy the file `ressources/ssl/ssl-params.conf` in the VM
```console
mjacques@roger-skyline:~$ sudo vim /etc/nginx/snippets/ssl-params.conf
mjacques@roger-skyline:~$ sudo chmod 0644 /etc/nginx/snippets/ssl-params.conf
```

Copy the file `ressources/ssl/roger-skyline.com` in the VM
```console
mjacques@roger-skyline:~$ sudo vim /etc/nginx/sites-available/roger-skyline
mjacques@roger-skyline:~$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
mjacques@roger-skyline:~$ sudo systemctl reload nginx
```

Now you can connect to the webpage by `https://10.114.254.42`

## More
List of common script
```console
mjacques@roger-skyline:~$ less /etc/services
```

Scan ports open on the VM
```console
mjacques@roger-skyline:~$ sudo nmap -v 10.114.254.42
[sudo] password for mjacques:

Starting Nmap 7.40 ( https://nmap.org ) at 2019-03-31 19:20 PDT
Initiating Parallel DNS resolution of 1 host. at 19:20
Completed Parallel DNS resolution of 1 host. at 19:20, 0.00s elapsed
Initiating SYN Stealth Scan at 19:20
Scanning 10.114.254.42 [1000 ports]
Discovered open port 80/tcp on 10.114.254.42
Discovered open port 443/tcp on 10.114.254.42
Discovered open port 4242/tcp on 10.114.254.42
Completed SYN Stealth Scan at 19:20, 20.70s elapsed (1000 total ports)
Nmap scan report for 10.114.254.42
Host is up (0.000055s latency).
Not shown: 997 filtered ports
PORT     STATE SERVICE
80/tcp   open  http
443/tcp  open  https
4242/tcp open  vrml-multi-use # Use for ssh
```

## Delete HDD from VirtualBox
```console
VBoxManage storageattach roger-skyline --storagectl "SATA" --port 0 --device 0 --type hdd --medium none # Umount the drive
VBoxManage list hdds
VBoxManage closemedium disk $UUID --delete
```

# Ressources
[VirtualBox command line](https://www.oracle.com/technetwork/articles/servers-storage-admin/manage-vbox-cli-2264359.html)
[Static IP Debian](https://linuxhint.com/debian-static-ip-configuration/)
[fail2ban](https://askubuntu.com/questions/745051/iptables-and-hacker-prevention)
[Nginx Debian](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-debian-9)
[SSL Certificate for Nginx](https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-on-debian-9)
