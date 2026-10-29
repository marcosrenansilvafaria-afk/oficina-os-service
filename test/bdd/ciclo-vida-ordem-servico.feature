# language: pt
Funcionalidade: Ciclo de vida da Ordem de Servico via Saga

  Cenario: Fluxo feliz completo ate a finalizacao
    Dado uma ordem de servico recebida para um cliente e veiculo
    Quando o atendente inicia o diagnostico
    E adiciona um item de servico com preco 150 e quantidade 1
    E gera o orcamento
    Entao o valor total da ordem deve ser 150
    E o status da ordem deve ser "AGUARDANDO_APROVACAO"
    Quando o evento PagamentoAprovadoEvent e recebido
    Entao o status da ordem deve ser "APROVADA"
    Quando o evento ExecucaoIniciadaEvent e recebido
    Entao o status da ordem deve ser "EM_EXECUCAO"
    Quando o evento ExecucaoConcluidaEvent e recebido
    Entao o status da ordem deve ser "FINALIZADA"

  Cenario: Compensacao por pagamento recusado
    Dado uma ordem de servico com orcamento gerado
    Quando o evento CompensarOSEvent com origem "PAGAMENTO" e recebido
    Entao o status da ordem deve ser "EM_DIAGNOSTICO"

  Cenario: Compensacao por falha de execucao
    Dado uma ordem de servico aprovada e em execucao
    Quando o evento CompensarOSEvent com origem "EXECUCAO" e recebido
    Entao o status da ordem deve ser "CANCELADA"
