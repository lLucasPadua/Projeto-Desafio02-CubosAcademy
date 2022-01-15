const express = require("express");
const contas = require("./controladores/controladores");
const roteador = express();

roteador.get("/contas", contas.todasAsContas);
roteador.post("/contas", contas.criarConta);
roteador.put("/contas/:numeroConta/usuario", contas.atualizarUsuarioConta);
roteador.delete("/contas/:numeroConta", contas.excluirConta);
roteador.post("/transacoes/depositar", contas.depositar);
roteador.post("/transacoes/sacar", contas.sacar);
roteador.post("/transacoes/transferir", contas.transferir);
roteador.get("/contas/saldo", contas.saldo);
roteador.get("/contas/extrato", contas.extrato);

module.exports = roteador;

//lucas pádua
