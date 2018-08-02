const { io } = require('../server');

const {Usuarios} = require('../classes/usuarios')

const usuarios = new Usuarios();

const {crearMensaje} = require('../util/utilidades')

io.on('connection', (client) => {

  client.on('entrarChat', (data, callback)=>{

    if(!data.nombre || !data.sala){
      return callback({
        ok: false,
        mensaje: 'El nombre es necesario'
      });
    }

    client.join(data.sala);

    usuarios.agregarPersona(client.id, data.nombre, data.sala);

    client.broadcast.to(data.sala).emit('listaPersona', usuarios.getPersonasPorSala(data.sala));
    client.broadcast.to(data.sala).emit('crearMensaje', crearMensaje('Administrador', `${ data.nombre } se unió al chat`));

    callback( usuarios.getPersonasPorSala(data.sala) );
  })

  client.on('crearMensaje', (data, callback)=>{

    let persona = usuarios.getPersona(client.id)

    let mensaje = crearMensaje( persona.nombre, data.mensaje )


    client.broadcast.to(persona.sala).emit('crearMensaje', mensaje);

    callback( mensaje );
  })

  client.on('disconnect', () =>{
    let personaBorrada = usuarios.borrarPersona(client.id);

    if(personaBorrada){
      client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${ personaBorrada.nombre } salió`));
      client.broadcast.to(personaBorrada.sala).emit('listaPersona', usuarios.getPersonasPorSala(personaBorrada.sala));
    }
  });

  //Mensajes Privados
  client.on('mensajePrivado', (data)=>{
    if(!data.idDestino){
      throw new Error('El id es necesario')
    }

    let persona = usuarios.getPersona(client.id);

    client.broadcast.to(data.idDestino).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje));

  })

});
