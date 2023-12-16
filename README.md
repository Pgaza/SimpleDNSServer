# DNS server

This script sets up a DNS server that we can manipulate to return an error or a specific IP address for certain domain requests.

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
];
```

To execute the server you only need to type:

```bash
node DNSserver.js
```
