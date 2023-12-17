# DNS server

This script sets up a DNS server were we can control to return diffent errors to and specific domain. If the domain ask for is not the blocked list it will query customDNSServer to obtain the real IP.

## Instalation

Prior to the installation you need to install Nodejs. Once you have it to perform the installation, you only need to execute the following command:

```bash
npm install
```

# Configuration

At the top of the script, you can find all the configuration parameters listed.

```js
// Define el servidor DNS al que quieres consultar
const customDNSServer = "80.58.61.250"; //DNS

// Puerto donde levantamos el servidor DNS
const PORT = 5333;

// Errores DNS
const rcodeList = {
	NOERROR: 0,
	FORMERR: 1,
	SERVFAIL: 2,
	NXDOMAIN: 3,
	NOTIMP: 4,
	REFUSED: 5,
	YXDOMAIN: 6,
	XRRSET: 7,
	NOTAUTH: 8,
	NOTZONE: 9,
	TIMEOUT: 666,
};

// Lista de dominios a los que se responderá con el codigo de error indicado en rcode
const blockedDomains = [
	{
		name: "example.com",
		rcode: buscarValorPorNombre("REFUSED"),
	},
	{
		name: "example2.com",
		rcode: buscarValorPorNombre("SERVFAIL"),
	},
	{
		name: "example3.com",
		rcode: rcodeList["TIMEOUT"],
	},
];
```

To execute the server you only need to type:

```bash
node DNSserver.js
```

If we query for domain *example2.com* we get the following logs in the server

```bash
22:30:17.375 Started DNS server in addess 0.0.0.0:5333
22:32:04.229 Domain example.com is blocked. Responding with REFUSED (5)
```
and the following response to the client:

```bash
$ dig @localhost -p 5333 example.com

; <<>> DiG 9.10.6 <<>> @localhost -p 5333 example.com
; (2 servers found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: REFUSED, id: 64701
;; flags: qr rd ad; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;example.com.                   IN      A

;; Query time: 1 msec
;; SERVER: 127.0.0.1#5333(127.0.0.1)
;; WHEN: Sat Dec 16 21:19:56 CET 2023
;; MSG SIZE  rcvd: 29
```


If we query for domain *example2.com* we get the following logs in the server

```bash
22:30:17.375 Started DNS server in addess 0.0.0.0:5333
22:33:13.400 Domain example2.com is blocked. Responding with SERVFAIL (2)
```
and the following response to the client:

```bash
dig @localhost -p 5333 example2.com

; <<>> DiG 9.10.6 <<>> @localhost -p 5333 example2.com
; (2 servers found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 2855
;; flags: qr rd ad; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;example2.com.                  IN      A

;; Query time: 1 msec
;; SERVER: 127.0.0.1#5333(127.0.0.1)
;; WHEN: Sun Dec 17 22:33:13 CET 2023
;; MSG SIZE  rcvd: 30
```

If we query for domain *example3.com* we get the following logs in the server (we see 3 queries because dig try 3 times wiht 5 seconds between them)

```bash
22:34:49.356 Domain example3.com is blocked. No responding so we must get a TIMEOUT in the DNS client
22:34:55.364 Domain example3.com is blocked. No responding so we must get a TIMEOUT in the DNS client
22:35:01.372 Domain example3.com is blocked. No responding so we must get a TIMEOUT in the DNS client
```

And no response is given to the client

```bash
dig @localhost -p 5333 example3.com

; <<>> DiG 9.10.6 <<>> @localhost -p 5333 example3.com
; (2 servers found)
;; global options: +cmd
;; connection timed out; no servers could be reached
```

If we query for domain that is not in the list like *marca.com* we ask the IP to the customDNSServer and send the IP to the client

```bash
22:36:36.598 Querying DNS (80.58.61.250) for domain: marca.com. Responding IP 34.147.120.111
```


and the following response to the client:


```bash
dig @localhost -p 5333 marca.com  

; <<>> DiG 9.10.6 <<>> @localhost -p 5333 marca.com
; (2 servers found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 35099
;; flags: qr rd ad; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
;; WARNING: recursion requested but not available

;; QUESTION SECTION:
;marca.com.                     IN      A

;; ANSWER SECTION:
marca.com.              300     IN      A       34.147.120.111

;; Query time: 10 msec
;; SERVER: 127.0.0.1#5333(127.0.0.1)
;; WHEN: Sat Dec 16 21:22:24 CET 2023
;; MSG SIZE  rcvd: 52
```
