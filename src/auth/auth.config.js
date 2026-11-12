const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const authRepository = require("./auth.repository");

function configureJwtStrategy() {
    const opcoes = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    };
    const estrategia = new JwtStrategy(opcoes, async (payload, done) => {
        try{
            const usuario = await authRepository.buscarPorId(payload.usuario_id);
            if(!usuario) return done(null, false);
            if(!usuario.ativo) return done(null, false);
            return done(null, usuario);
        }catch(erro){
            return done(erro);
        }
    })
    passport.use(estrategia);
}

function exigirAdministrativo(req, res, next) {
    const userValido = req.user;
    if(!userValido) return res.status(401).json({erro: "Usuario inválido"});
    if(userValido.perfil !== "Administrador") return res.status(403).json({erro: "Este perfil não tem a permissão necessaria"});
    next();
}

const requireJWTAuth = passport.authenticate("jwt", { session: false });

module.exports = {
    configureJwtStrategy,
    exigirAdministrativo,
    requireJWTAuth
}