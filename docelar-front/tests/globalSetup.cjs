// fixa o fuso para as datas darem o mesmo resultado em qualquer computador
module.exports = async () => {
  process.env.TZ = 'America/Sao_Paulo';
};
