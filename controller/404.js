exports.get404 = (req, res, next) => {
  res.status(404).render('errors/404');
};
