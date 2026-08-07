const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const nomeUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, nomeUnico);
    }
});

const filtroArquivo = (req, file, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const extensaoValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
    const mimeValido = tiposPermitidos.test(file.mimetype);

    if (extensaoValida && mimeValido) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens JPEG, PNG ou WEBP são permitidas'));
    }
};

const upload = multer({
    storage,
    fileFilter: filtroArquivo,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;