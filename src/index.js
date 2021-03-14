const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const customers = [];

//middleware
function verifyIfExistAccountCPF(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find( costumer => {
    return costumer.cpf === cpf;
  });

  if(!customer) {
    return response.status(404).json({Error: "Customer not found!"});
  }

  request.customer = customer;

  return next();
}

//funções auxliares
function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type == "credit"){
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;
  
  const customerAlreadyExist = customers.some(costumer => {
    return costumer.cpf === cpf;
  });
  
  if(customerAlreadyExist){
    return response.status(404).json({ Error : "Customer already exists!"});
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  });


  return response.status(201).send();
});

app.get("/statement", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer.statement);
});

app.post("/deposit", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  const { description, amount } = request.body;

  const operationData = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(operationData);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  
  const balance = getBalance(customer.statement);

  if(balance < amount){
    return response.status(400).json({ error : "Insufficient funds!"})
  }

  const operationData = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(operationData);

  return response.status(201).send();


});

app.get("/statement/date", verifyIfExistAccountCPF, (request, response) => {
  const { date } = request.query;
  const { customer } = request;

  const dateFormated = new Date(date + " 00:00");

  const statements = customer.statement.filter(( statement ) => {
    return statement.created_at.toDateString() === dateFormated.toDateString();
  });

  return response.json(statements);
});

app.put("/account", verifyIfExistAccountCPF, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(200).send();
});

app.get("/account",verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  return response.json(customer);
});

app.delete("/account",  verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;

  //remove a partir da posição
  customers.splice(customer, 1);
  
  return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistAccountCPF, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statement);

  return response.status(200).json({ balance});
})


app.listen(3333);