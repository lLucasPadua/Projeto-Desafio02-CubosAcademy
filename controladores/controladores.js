const bancoDeDados = require("../src/bancodedados");
const { format } = require("date-fns");

function todasAsContas(req, res) {
  if (req.query.senha_banco === bancoDeDados.banco.senha) {
    res.status(200);
    res.json(bancoDeDados.contas);
  } else {
    res.status(403);
    res.json({ mensagem: "A senha do banco informada é inválida!" });
  }
}
let proximoNumero = 1;

function validarConta(conta, numeroConta) {
  if (!conta.nome) {
    return "O campo nome é obrigatorio";
  }
  if (!conta.cpf) {
    return "O campo CPF é obrigatorio";
  }
  if (!conta.data_nascimento) {
    return "O campo data de nascimento é obrigatorio";
  }
  if (!conta.telefone) {
    return "O campo Telefone é obrigatorio";
  }
  if (!conta.email) {
    return "O campo Email é obrigatorio";
  }
  if (!conta.senha) {
    return "O campo senha é obrigatorio";
  }
  const emailOuCpfExistente = bancoDeDados.contas.some((indexConta) => {
    return (
      (indexConta.numero != numeroConta &&
        indexConta.usuario.cpf == conta.cpf) ||
      indexConta.usuario.email == conta.email
    );
  });
  if (emailOuCpfExistente) {
    return "Já existe uma conta com o cpf ou e-mail informado!";
  }
  console.log(emailOuCpfExistente);
}

function criarConta(req, res) {
  const mensagem = validarConta(req.body);

  if (mensagem) {
    res.status(400);
    res.json({ mensagem });
    return;
  }

  const novaConta = {
    numero: proximoNumero,
    saldo: 0,
    usuario: {
      nome: req.body.nome,
      cpf: req.body.cpf,
      data_nascimento: req.body.data_nascimento,
      telefone: req.body.telefone,
      email: req.body.email,
      senha: req.body.senha,
    },
  };

  bancoDeDados.contas.push(novaConta);
  proximoNumero++;
  res.status(200).send();
}

function atualizarUsuarioConta(req, res) {
  const mensagem = validarConta(req.body, req.params.numeroConta);

  if (mensagem) {
    return res.status(400).json({ mensagem });
  }
  if (req.params.numeroConta) {
    const index = bancoDeDados.contas.findIndex((conta) => {
      return conta.numero == req.params.numeroConta;
    });
    if (index >= 0) {
      bancoDeDados.contas[index] = {
        numero: bancoDeDados.contas[index].numero,
        saldo: bancoDeDados.contas[index].saldo,
        usuario: {
          nome: req.body.nome,
          cpf: req.body.cpf,
          data_nascimento: req.body.data_nascimento,
          telefone: req.body.telefone,
          email: req.body.email,
          senha: req.body.senha,
        },
      };

      res.status(200).send();
    } else {
      return res.status(404).json({ mensagem: "Conta Não encontrada" });
    }
  }
}

function excluirConta(req, res) {
  const index = bancoDeDados.contas.findIndex((conta) => {
    return conta.numero == req.params.numeroConta;
  });

  if (bancoDeDados.contas[index].saldo === 0) {
    bancoDeDados.contas.splice(index, 1);
    res.status(200).send();
  } else {
    return res
      .status(404)
      .json({ mensagem: "A conta só pode ser removida se o saldo for zero" });
  }
}
function depositar(req, res) {
  const { numero_conta, valor } = req.body;

  const index = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta;
  });

  if (!numero_conta || valor === undefined) {
    res
      .status(400)
      .json({ mensagem: "O número da conta e o valor são obrigatórios!" });
    return;
  }
  if (valor <= 0) {
    res.status(403).json({ mensagem: "Valor não pode ser depositado" });
    return;
  }
  if (!index) {
    res.status(400).json({ mensagem: "Conta informada não existe" });
    return;
  }
  index.saldo += valor;
  bancoDeDados.depositos.push({
    data: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    numero_conta,
    valor,
  });
  res.status(200).send();
}

function sacar(req, res) {
  const { numero_conta, valor, senha } = req.body;
  const index = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta;
  });
  if (!numero_conta || valor === undefined || !senha) {
    res
      .status(400)
      .json({ mensagem: "O número da conta e o valor são obrigatórios!" });
    return;
  }
  if (!index) {
    res.status(400).json({ mensagem: "Conta informada não existe" });
    return;
  }
  if (senha !== index.usuario.senha) {
    res.status(400).json({ mensagem: "Senha do Usuario incorreta" });
    return;
  }
  if (valor > index.saldo) {
    res.status(400).json({ mensagem: "Saldo insuficiente" });
    return;
  }
  index.saldo -= valor;
  bancoDeDados.saques.push({
    data: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    numero_conta,
    valor,
  });
  res.status(200).send();
}

function transferir(req, res) {
  const { numero_conta_origem, numero_conta_destino, valor, senha } = req.body;
  const contaOrigem = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta_origem;
  });
  const contaDestino = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta_destino;
  });

  if (!numero_conta_origem || !numero_conta_destino || valor === undefined) {
    res
      .status(400)
      .json({ mensagem: "O número da conta e o valor são obrigatórios!" });
    return;
  }
  if (contaOrigem.usuario.senha !== senha) {
    res.status(400).json({ mensagem: "Senha informada Incorreta" });
    return;
  }
  if (!contaOrigem) {
    res
      .status(400)
      .json({ mensagem: "O número da conta e o valor são obrigatórios!" });
    return;
  }
  if (!contaDestino) {
    res
      .status(400)
      .json({ mensagem: "O número da conta e o valor são obrigatórios!" });
    return;
  }
  if (valor > contaOrigem.saldo) {
    res.status(400).json({ mensagem: "Saldo insuficiente" });
    return;
  }
  contaOrigem.saldo -= valor;
  contaDestino.saldo += valor;
  bancoDeDados.transferencias.push({
    data: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
    numero_conta_origem,
    numero_conta_destino,
    valor,
  });
  res.status(200).send();
}

function saldo(req, res) {
  const { numero_conta, senha } = req.query;
  const contaExiste = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta;
  });
  if (!numero_conta || !senha) {
    res
      .status(400)
      .json({ mensagem: "Numero da conta e senha não foram informados" });
    return;
  }
  if (!contaExiste) {
    res.status(400).json({ mensagem: "Conta bancária não encontada!" });
    return;
  }
  if (contaExiste.usuario.senha !== senha) {
    res.status(400).json({ mensagem: "Senha informada Incorreta" });
    return;
  }
  res.status(200).json({ saldo: contaExiste.saldo });
}
function extrato(req, res) {
  const { numero_conta, senha } = req.query;
  const contaExiste = bancoDeDados.contas.find((conta) => {
    return conta.numero == numero_conta;
  });
  if (!numero_conta || !senha) {
    res
      .status(400)
      .json({ mensagem: "Numero da conta e senha não foram informados" });
    return;
  }
  if (!contaExiste) {
    res.status(400).json({ mensagem: "Conta bancária não encontada!" });
    return;
  }
  if (contaExiste.usuario.senha !== senha) {
    res.status(400).json({ mensagem: "Senha informada Incorreta" });
    return;
  }
  res.status(200).json({
    depositos: bancoDeDados.depositos,
    saques: bancoDeDados.saques,
    transferencias: bancoDeDados.transferencias,
  });
}

module.exports = {
  extrato,
  saldo,
  transferir,
  sacar,
  todasAsContas,
  criarConta,
  atualizarUsuarioConta,
  excluirConta,
  depositar,
};
