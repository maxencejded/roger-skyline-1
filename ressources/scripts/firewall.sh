#!/bin/sh
PATH='/sbin'

# Flush the tables to apply changes
iptables -F

# Drop everything execpt the output internet
iptables -P FORWARD	DROP
iptables -P INPUT	DROP
iptables -P OUTPUT	ACCEPT

# Allow established connections (the responses to our outgoing traffic)
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow local programs that use loopback (Unix sockets)
iptables -A INPUT -s 127.0.0.0/8 -d 127.0.0.0/8 -i lo -j ACCEPT

# Allow INPUT for SSH
iptables -A INPUT -p tcp --dport 4242 -m state --state NEW -j ACCEPT

# Allow INPUT for NGINX (HTTP: 80 | HTTPS: 443)
iptables -A INPUT -p tcp --dport 80 -m state --state NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m state --state NEW -j ACCEPT
