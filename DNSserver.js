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
const pc = require("picocolors");
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
	TIMEOUT: 666,
};

// Lista de dominios a los que se responderá con el codigo de error indicado en rcode
const blockedDomains = [
	{
		name: "example.com",
		rcode: rcodeList["REFUSED"],
	},
	{
		name: "example2.com",
		rcode: rcodeList["SERVFAIL"],
	},
	{
		name: "example3.com",
		rcode: rcodeList["TIMEOUT"],
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

// function buscarValorPorNombre(nombre) {
// 	// Verificar si la cadena existe en la asociación
// 	if (rcodeList.hasOwnProperty(nombre)) {
// 		return rcodeList[nombre];
// 	} else {
// 		return "No se encontró la cadena en la asociación";
// 		process.exit(1);
// 	}
// }

function obtenerNombrePorValor(valor) {
	for (const nombre in rcodeList) {
		if (rcodeList[nombre] === valor) return nombre;
	}
	return "";
}

function debug(text) {
	const fechaConHora = new Date();
	const hora = fechaConHora.getHours().toString().padStart(2, "0");
	const minutos = fechaConHora.getMinutes().toString().padStart(2, "0");
	const segundos = fechaConHora.getSeconds().toString().padStart(2, "0");
	const milisegundos = fechaConHora.getMilliseconds().toString().padStart(3, "0");
	const horaString = `${hora}:${minutos}:${segundos}.${milisegundos}`;
	console.log(`${pc.bold(pc.white(horaString))} ${text}`);
}
// Creamos el servidor que atenderá las operaciones
const server = dns2.createServer({
	udp: true,

	handle: (request, send, rinfo) => {
		const domain = request.questions[0].name;
		//debug(`Peticion dominio ${pc.yellow(domain)}`);

		if (blockedDomains.some((entry) => entry.name === domain)) {
			// Tenemos un servidor
			const { rcode } = getRCodeForDomain(domain);
			// Miramos si es un timeout
			if (rcode == rcodeList.TIMEOUT) {
				debug(
					`Domain ${pc.yellow(domain)} is blocked. No responding so we must get a ${pc.red(
						"TIMEOUT"
					)} in the DNS client`
				);
				return;
			}
			// Llegado aqui no es un timeout seguimos adelante...
			debug(
				`Domain ${pc.yellow(domain)} is blocked. Responding with ${pc.red(obtenerNombrePorValor(rcode))} (${rcode})`
			);
			const response = Packet.createResponseFromRequest(request);
			response.header.rcode = rcode;
			send(response);
		} else {
			const DNSOptions = { question: request.questions[0] };
			dns.resolve4(domain, DNSOptions, (err, addresses) => {
				if (err) {
					const response = Packet.createResponseFromRequest(request);
					response.header.rcode = rcodeList.NXDOMAIN;
					debug(
						`Error querying DNS ${customDNSServer}: ${err.message}. Responding with ${pc.red(
							obtenerNombrePorValor(response.header.rcode)
						)} (${response.header.rcode})`
					);
					send(response);
				} else {
					debug(`Querying DNS (${customDNSServer}) for domain: ${pc.yellow(domain)}. Responding IP ${addresses[0]}`);
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
	//console.log("Peticion: " + request.header.id, request.questions[0]);
});

server.on("requestError", (error) => {
	console.log("Client sent an invalid request", error);
});

server.on("listening", () => {
	debug(
		`Started DNS server in addess ${pc.green(server.addresses().udp.address)}:${pc.green(server.addresses().udp.port)}`
	);
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
