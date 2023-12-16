// #####################################################################################################################################
// Servidor DNS. JFG
// v1.0 15/12/23
//    Primera version
//
// MIT License
//
// Copyright (c) 2023 JFG
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// * The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ###################################################################################################################################
const dns2 = require("dns2");
const dns = require("node:dns");
const { Packet } = dns2;

//##############################################################################################
// Variables de configuracion
//##############################################################################################
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

//##############################################################################################
// Aqui empieza el codigo del servidor
//##############################################################################################
// Configurar el servidor DNS
dns.setServers([customDNSServer]);

function getRCodeForDomain(domain) {
	return (entry = blockedDomains.find((entry) => entry.name === domain));
}

function buscarValorPorNombre(nombre) {
	// Verificar si la cadena existe en la asociación
	if (rcodeList.hasOwnProperty(nombre)) {
		return rcodeList[nombre];
	} else {
		return "No se encontró la cadena en la asociación";
		process.exit(1);
	}
}

// Creamos el servidor que atenderá las operaciones
const server = dns2.createServer({
	udp: true,

	handle: (request, send, rinfo) => {
		const domain = request.questions[0].name;

		if (blockedDomains.some((entry) => entry.name === domain)) {
			// Tenemos un servidor
			const { rcode } = getRCodeForDomain(domain);
			console.log(`Domain ${domain} is blocked. Responding with ERROR ${rcode}`);
			const response = Packet.createResponseFromRequest(request);
			response.header.rcode = rcode;
			send(response);
		} else {
			const DNSOptions = { question: request.questions[0] };
			dns.resolve4(domain, DNSOptions, (err, addresses) => {
				if (err) {
					console.error(`Error querying DNS ${customDNSServer}: ${err.message}`);
					const response = Packet.createResponseFromRequest(request);
					response.header.rcode = buscarValorPorNombre("SERVFAIL");
					send(response);
				} else {
					console.log(`Querying DNS (${customDNSServer}) for domain: ${domain}`);
					const response = Packet.createResponseFromRequest(request);
					const [question] = request.questions;
					const { name } = question;
					response.answers.push({
						name,
						type: Packet.TYPE.A,
						class: Packet.CLASS.IN,
						ttl: 300,
						address: addresses[0],
					});
					send(response);
				}
			});
		}
	},
});

server.on("request", (request, response, rinfo) => {
	console.log(request.header.id, request.questions[0]);
});

server.on("requestError", (error) => {
	console.log("Client sent an invalid request", error);
});

server.on("listening", () => {
	console.log(server.addresses());
});

server.on("close", () => {
	console.log("server closed");
});

server.listen({
	udp: {
		port: PORT,
		address: "0.0.0.0",
		type: "udp4",
	},
});
