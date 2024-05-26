//REQUERINDO MODULOS
import * as menu from '../lib/menu.js'
import moment from "moment-timezone"
import {criarTexto,erroComandoMsg, timestampParaData, consoleErro, versaoAtual} from '../lib/util.js'
import * as socket from '../baileys/socket.js'
import {BotControle} from '../controles/BotControle.js'
import {GrupoControle} from '../controles/GrupoControle.js'
import {UsuarioControle} from '../controles/UsuarioControle.js'
import { MessageTypes } from '../baileys/mensagem.js'
import { downloadMediaMessage } from '@whiskeysockets/baileys'
import os from 'node:os'
import {obterMensagensTexto} from '../lib/msgs.js'


export const admin = async(c, mensagemBaileys, botInfo) => {
    //Atribuição de valores
    const bot = new BotControle()
    const usuarios = new UsuarioControle()
    const grupos = new GrupoControle()
    const msgs_texto = obterMensagensTexto(botInfo)
    const {numero_dono, hostNumber : numero_bot, prefixo, nome_bot, nome_adm} = botInfo
    const {
        mensagem_dono,
        texto_recebido,
        comando,
        args,
        mensagem_completa,
        id_chat,
        mensagem_grupo,
        t,
        tipo,
        mensagem_midia,
        mensagem_citada,
        mencionados,
        midia,
        citacao
    } = mensagemBaileys
    const {mimetype} = {...midia}
    const usuariosBloqueados = await socket.obterContatosBloqueados(c)
    const comandoSemPrefixo = comando.replace(prefixo, "")

    //Verificando se é mensagem do dono do bot
    if (!mensagem_dono) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.apenas_dono_bot, mensagem_completa)
    
    // Comandos de admin
    try{
        switch(comandoSemPrefixo){
            case "admin":
                try{
                    await socket.enviarTexto(c, id_chat, menu.menuAdmin(botInfo))
                } catch(err){
                    throw err
                }
                break

            case "infocompleta":
                try{
                    let version = versaoAtual()
                    let infoBot = botInfo
                    let expiracaoLimiteDiario = timestampParaData(infoBot.limite_diario.expiracao * 1000)
                    let botInicializacaoData = timestampParaData(infoBot.iniciado)
                    let resposta = criarTexto(msgs_texto.admin.infocompleta.resposta_superior, nome_adm?.trim(), nome_bot?.trim(), botInicializacaoData, version)
                    // AUTO-STICKER
                    resposta += (infoBot.autosticker) ? msgs_texto.admin.infocompleta.resposta_variavel.autosticker.on: msgs_texto.admin.infocompleta.resposta_variavel.autosticker.off
                    // AUTO-REVELAR
                    resposta += (infoBot.autorevelar) ? msgs_texto.admin.infocompleta.resposta_variavel.autorevelar.on: msgs_texto.admin.infocompleta.resposta_variavel.autorevelar.off
                    // PV LIBERADO
                    resposta += (infoBot.pvliberado) ? msgs_texto.admin.infocompleta.resposta_variavel.pvliberado.on: msgs_texto.admin.infocompleta.resposta_variavel.pvliberado.off
                    // LIMITE COMANDOS DIARIO
                    resposta += (infoBot.limite_diario.status) ? criarTexto(msgs_texto.admin.infocompleta.resposta_variavel.limite_diario.on,  expiracaoLimiteDiario) : msgs_texto.admin.infocompleta.resposta_variavel.limite_diario.off
                    // LIMITE COMANDOS POR MINUTO
                    resposta += (infoBot.limitecomandos.status) ? criarTexto(msgs_texto.admin.infocompleta.resposta_variavel.taxa_comandos.on, infoBot.limitecomandos.cmds_minuto_max, infoBot.limitecomandos.tempo_bloqueio) : msgs_texto.admin.infocompleta.resposta_variavel.taxa_comandos.off
                    // BLOQUEIO DE COMANDOS
                    let comandosBloqueados = []
                    for(let comandoBloqueado of infoBot.bloqueio_cmds){
                        comandosBloqueados.push(prefixo+comandoBloqueado)
                    }
                    resposta += (infoBot.bloqueio_cmds.length != 0) ? criarTexto(msgs_texto.admin.infocompleta.resposta_variavel.bloqueiocmds.on, comandosBloqueados.toString()) : msgs_texto.admin.infocompleta.resposta_variavel.bloqueiocmds.off
                    resposta += criarTexto(msgs_texto.admin.infocompleta.resposta_inferior, usuariosBloqueados.length, infoBot.cmds_executados, numero_dono.replace("@s.whatsapp.net", ""))
                    await socket.obterFotoPerfil(c, numero_bot).then(async (fotoBot)=>{
                        await socket.responderArquivoUrl(c, MessageTypes.image, id_chat, fotoBot, resposta, mensagem_completa)
                    }).catch(async ()=>{
                        await socket.responderTexto(c, id_chat, resposta, mensagem_completa)
                    })
                } catch(err){
                    throw err
                }

                break
                
            case 'entrargrupo':
                try{
                    if (args.length < 2) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let linkGrupo = args[1]
                    let linkValido = linkGrupo.match(/(https:\/\/chat.whatsapp.com)/gi)
                    if (!linkValido) return await socket.responderTexto(c, id_chat, msgs_texto.admin.entrar_grupo.link_invalido, mensagem_completa)
                    let idLink = linkGrupo.replace(/(https:\/\/chat.whatsapp.com\/)/gi, '')
                    await socket.entrarLinkGrupo(c, idLink).then(async (res)=>{
                        if (res == undefined) await socket.responderTexto(c, id_chat, msgs_texto.admin.entrar_grupo.pendente,mensagem_completa)
                        else await socket.responderTexto(c, id_chat, msgs_texto.admin.entrar_grupo.entrar_sucesso,mensagem_completa)
                    }).catch(async ()=>{
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.entrar_grupo.entrar_erro, mensagem_completa)
                    })
                } catch(err){
                    throw err
                }

                break

            case 'sair':
                try{
                    if(args.length > 1){
                        let gruposAtuais = await grupos.obterTodosGruposInfo()
                        let indexGrupo = texto_recebido.slice(6).trim()
                        if(isNaN(indexGrupo)) return await socket.responderTexto(c, id_chat, msgs_texto.admin.sair.nao_encontrado, mensagem_completa)
                        indexGrupo = parseInt(indexGrupo) - 1
                        if(!gruposAtuais[indexGrupo]) return await socket.responderTexto(c, id_chat, msgs_texto.admin.sair.nao_encontrado, mensagem_completa)
                        await socket.sairGrupo(c, gruposAtuais[indexGrupo].id_grupo)
                        await socket.enviarTexto(c, numero_dono, msgs_texto.admin.sair.resposta_admin)
                    } else if(args.length == 1 && mensagem_grupo){
                        await socket.sairGrupo(c, id_chat)
                        await socket.enviarTexto(c, numero_dono, msgs_texto.admin.sair.resposta_admin)
                    } else{
                        await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) ,mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break

            case 'listablock':
                try{
                    if(usuariosBloqueados.length == 0) return await socket.responderTexto(c, id_chat, msgs_texto.admin.listablock.lista_vazia, mensagem_completa)
                    let resposta = criarTexto(msgs_texto.admin.listablock.resposta_titulo, usuariosBloqueados.length)
                    for (let i of usuariosBloqueados) resposta += criarTexto(msgs_texto.admin.listablock.resposta_itens, i.replace(/@s.whatsapp.net/g,''))
                    await socket.responderTexto(c, id_chat, resposta, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "bcmdglobal":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) ,mensagem_completa)
                    let usuarioComandos = texto_recebido.slice(12).split(" "), respostaBloqueio = await bot.bloquearComandosGlobal(usuarioComandos, botInfo)
                    await socket.responderTexto(c, id_chat, respostaBloqueio, mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "dcmdglobal":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat,erroComandoMsg(comando, botInfo),mensagem_completa)
                    let usuarioComandos = texto_recebido.slice(12).split(" "), respostaDesbloqueio = await bot.desbloquearComandosGlobal(usuarioComandos, botInfo)
                    await socket.responderTexto(c, id_chat, respostaDesbloqueio, mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case 'sairgrupos':
                try{
                    let gruposAtuais = await grupos.obterTodosGruposInfo()
                    for (let grupo of gruposAtuais) await socket.sairGrupo(c, grupo.id_grupo)
                    let resposta = criarTexto(msgs_texto.admin.sairtodos.resposta, gruposAtuais.length)
                    await socket.responderTexto(c, numero_dono, resposta, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "bloquear":
                try{
                    let usuariosBloqueados = []
                    if(mensagem_citada){
                        usuariosBloqueados.push(citacao.remetente)
                    } else if(mencionados.length > 1) {
                        usuariosBloqueados = mencionados
                    } else {
                        let numeroInserido = texto_recebido.slice(10).trim()
                        if(numeroInserido.length == 0) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                        usuariosBloqueados.push(numeroInserido.replace(/\W+/g,"")+"@s.whatsapp.net")
                    }
                    for (let usuario of usuariosBloqueados){
                        if(numero_dono == usuario){
                            await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.bloquear.erro_dono, usuario.replace(/@s.whatsapp.net/g, '')), mensagem_completa)
                        } else {
                            if(usuariosBloqueados.includes(usuario)) {
                                await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.bloquear.ja_bloqueado, usuario.replace(/@s.whatsapp.net/g, '')), mensagem_completa)
                            } else {
                                await socket.bloquearContato(c, usuario)
                                await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.bloquear.sucesso, usuario.replace(/@s.whatsapp.net/g, '')), mensagem_completa)
                            }
                        }
                    }
                } catch(err){
                    throw err
                }
                break      

            case "desbloquear":
                try{
                    let usuariosDesbloqueados = []
                    if(mensagem_citada){
                        usuariosDesbloqueados.push(citacao.remetente)
                    } else if(mencionados.length > 1) {
                        usuariosDesbloqueados = mencionados
                    } else {
                        let numeroInserido = texto_recebido.slice(13).trim()
                        if(numeroInserido.length == 0) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                        usuariosDesbloqueados.push(numeroInserido.replace(/\W+/g,"")+"@s.whatsapp.net")
                    }
                    for (let usuario of usuariosDesbloqueados){
                        if(!usuariosBloqueados.includes(usuario)) {
                            await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.desbloquear.ja_desbloqueado, usuario.replace(/@s.whatsapp.net/g,'')), mensagem_completa)
                        } else {
                            await socket.desbloquearContato(c, usuario)
                            await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.desbloquear.sucesso, usuario.replace(/@s.whatsapp.net/g,'')), mensagem_completa)
                        }
                    }
                } catch(err){
                    throw err
                }
                break

            case "autostickerpv":
                try{
                    let novoEstado = !botInfo.autosticker
                    if(novoEstado){
                        await bot.alterarAutoSticker(true, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.autostickerpv.ativado,mensagem_completa)
                    } else {
                        await bot.alterarAutoSticker(false, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.autostickerpv.desativado,mensagem_completa)
                    } 
                } catch(err){
                    throw err
                }
                break

            case "autorevelar":
                try{
                    let novoEstado = !botInfo.autorevelar
                    if(novoEstado){
                        await bot.alterarAutoRevelar(true, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.autorevelar.ativado, mensagem_completa)
                    } else {
                        await bot.alterarAutoRevelar(false, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.autorevelar.desativado, mensagem_completa)
                    } 
                } catch(err){
                    throw err
                }
                break

            case "revelar":
                try{
                    if(!mensagem_citada && !citacao.mensagem_vunica) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    let mensagemVisivel = citacao.mensagem_citacao.message
                    mensagemVisivel[citacao.tipo].viewOnce = false
                    await socket.retransmitirMensagem(c, id_chat, mensagemVisivel, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "pvliberado":
                try{
                    let novoEstado = !botInfo.pvliberado
                    if(novoEstado){
                        await bot.alterarPvLiberado(true, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.pvliberado.ativado,mensagem_completa)
                    } else {
                        await bot.alterarPvLiberado(false, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.pvliberado.desativado,mensagem_completa)
                    } 
                } catch(err){
                    throw err
                }
                break

            case "fotobot":
                try{
                    if(!mensagem_midia && !mensagem_citada) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    let dadosMensagem = {
                        tipo : (mensagem_midia) ? tipo : citacao.tipo,
                        mimetype : (mensagem_midia)? mimetype : citacao.mimetype,
                        mensagem: (mensagem_midia) ? mensagem_completa : citacao.mensagem_citacao
                    }
                    if(dadosMensagem.tipo != MessageTypes.image) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    let fotoBuffer = await downloadMediaMessage(dadosMensagem.mensagem, "buffer")
                    await socket.alterarFotoPerfil(c, numero_bot, fotoBuffer)
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.fotobot.sucesso, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "limitediario":
                try{
                    let novoEstado = !botInfo.limite_diario.status
                    if(novoEstado){
                        await bot.alterarLimiteDiario(true, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.limitediario.ativado, mensagem_completa)
                    } else {
                        await bot.alterarLimiteDiario(false, botInfo)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.limitediario.desativado, mensagem_completa)
                    } 
                } catch(err){
                    throw err
                }

                break

            case "taxalimite":
                try{
                    let novoEstado = !botInfo.limitecomandos.status
                    if(novoEstado){
                        if(args.length !== 3) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                        let qtd_max_minuto = args[1], tempo_bloqueio = args[2]
                        if(isNaN(qtd_max_minuto) || qtd_max_minuto < 3) return await socket.responderTexto(c, id_chat,msgs_texto.admin.limitecomandos.qtd_invalida, mensagem_completa)
                        if(isNaN(tempo_bloqueio) || tempo_bloqueio < 10) return await socket.responderTexto(c, id_chat,msgs_texto.admin.limitecomandos.tempo_invalido, mensagem_completa)
                        await bot.alterarLimitador(botInfo, true, parseInt(qtd_max_minuto), parseInt(tempo_bloqueio))
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.limitecomandos.ativado, mensagem_completa)
                    } else {
                        await bot.alterarLimitador(botInfo, false)
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.limitecomandos.desativado, mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break

            case "nomebot":
                try{
                    if(args.length == 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let usuarioTexto = texto_recebido.slice(9).trim()
                    await bot.alterarNomeBot(usuarioTexto, botInfo)
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.nomebot.sucesso, mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "nomeadm":
                try{
                    if(args.length == 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let usuarioTexto = texto_recebido.slice(9).trim()
                    await bot.alterarNomeAdm(usuarioTexto, botInfo)
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.nomeadm.sucesso, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "nomesticker":
                try{
                    if(args.length == 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let usuarioTexto = texto_recebido.slice(13).trim()
                    await bot.alterarNomeFigurinhas(usuarioTexto, botInfo)
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.nomesticker.sucesso, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "prefixo":
                try{
                    if(args.length == 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let usuarioTexto = texto_recebido.slice(9).trim(), prefixosSuportados = ["!", "#", ".", "*"]
                    if(!prefixosSuportados.includes(usuarioTexto)) return await socket.responderTexto(c, id_chat, msgs_texto.admin.prefixo.nao_suportado, mensagem_completa)
                    await bot.alterarPrefixo(usuarioTexto, botInfo)
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.prefixo.sucesso, mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "mudarlimite":
                try{
                    if(!botInfo.limite_diario.status) return await socket.responderTexto(c, id_chat, msgs_texto.admin.mudarlimite.erro_limite_diario, mensagem_completa)
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let tipo = args[1].toLowerCase(), qtd = args[2]
                    if(qtd != -1) if(isNaN(qtd) || qtd < 5) return await socket.responderTexto(c, id_chat, msgs_texto.admin.mudarlimite.invalido, mensagem_completa)
                    let alterou = await bot.alterarQtdLimiteDiarioTipo(tipo, parseInt(qtd), botInfo)
                    if(!alterou) return await socket.responderTexto(c, id_chat, msgs_texto.admin.mudarlimite.tipo_invalido, mensagem_completa)
                    await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.mudarlimite.sucesso, tipo.toUpperCase(), qtd == -1 ? "∞" : qtd), mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "usuarios":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let tipo = args[1].toLowerCase()
                    let usuariosTipo = await usuarios.obterUsuariosTipo(tipo)
                    if(usuariosTipo.length == 0) return await socket.responderTexto(c, id_chat, msgs_texto.admin.usuarios.nao_encontrado, mensagem_completa)
                    let respostaItens = ''
                    for (let usuario of usuariosTipo) respostaItens += criarTexto(msgs_texto.admin.usuarios.resposta_item, usuario.nome, usuario.id_usuario.replace("@s.whatsapp.net", ""), usuario.comandos_total)
                    let resposta = criarTexto(msgs_texto.admin.usuarios.resposta_titulo, tipo.toUpperCase(), usuariosTipo.length, respostaItens)
                    await socket.responderTexto(c, id_chat, resposta, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "limpartipo":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let tipo = args[1].toLowerCase()
                    let limpou = await usuarios.limparTipo(tipo, botInfo)
                    if(!limpou) return await socket.responderTexto(c, id_chat, msgs_texto.admin.limpartipo.erro, mensagem_completa)
                    await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.limpartipo.sucesso, tipo.toUpperCase()), mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "alterartipo":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let usuario_tipo = ""
                    if(mensagem_citada) usuario_tipo = citacao.remetente
                    else if(mencionados.length === 1) usuario_tipo = mencionados[0]
                    else if(args.length > 2) usuario_tipo = args.slice(2).join("").replace(/\W+/g,"")+"@s.whatsapp.net"
                    else return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo),mensagem_completa)
                    if(numero_dono == usuario_tipo) return await socket.responderTexto(c, id_chat, msgs_texto.admin.alterartipo.tipo_dono, mensagem_completa)
                    let c_registrado = await usuarios.verificarRegistro(usuario_tipo)
                    if(c_registrado){
                        let alterou = await usuarios.alterarTipoUsuario(usuario_tipo, args[1], botInfo)
                        if(!alterou) return await socket.responderTexto(c, id_chat, msgs_texto.admin.alterartipo.tipo_invalido, mensagem_completa)
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.alterartipo.sucesso, args[1].toUpperCase()), mensagem_completa)
                    } else {
                        await socket.responderTexto(c, id_chat, msgs_texto.admin.alterartipo.nao_registrado, mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break
        
            case "tipos":
                try{
                    let tipos = botInfo.limite_diario.limite_tipos, respostaTipos = ''
                    for (let tipo in tipos) respostaTipos += criarTexto(msgs_texto.admin.tipos.item_tipo, msgs_texto.tipos[tipo], tipos[tipo] || "∞")
                    await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.tipos.resposta, respostaTipos), mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "rtodos":
                try{
                    if(!botInfo.limite_diario.status) return await socket.responderTexto(c, id_chat, msgs_texto.admin.rtodos.erro_limite_diario,mensagem_completa)
                    await usuarios.resetarComandosDia()
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.rtodos.sucesso,mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "r":
                try{
                    if(!botInfo.limite_diario.status) return await socket.responderTexto(c, id_chat, msgs_texto.admin.r.erro_limite_diario,mensagem_completa)
                    if(mensagem_citada){
                        let r_registrado = await usuarios.verificarRegistro(citacao.remetente)
                        if(r_registrado){
                            await usuarios.resetarComandosDiaUsuario(citacao.remetente)
                            await socket.responderTexto(c, id_chat, msgs_texto.admin.r.sucesso,mensagem_completa)
                        } else {
                            return await socket.responderTexto(c, id_chat, msgs_texto.admin.r.nao_registrado,mensagem_completa)
                        }
                    } else if (mencionados.length === 1){
                        let r_registrado = await usuarios.verificarRegistro(mencionados[0])
                        if(r_registrado){
                            await usuarios.resetarComandosDiaUsuario(mencionados[0])
                            await socket.responderTexto(c, id_chat, msgs_texto.admin.r.sucesso,mensagem_completa)
                        } else {
                            return await socket.responderTexto(c, id_chat, msgs_texto.admin.r.nao_registrado,mensagem_completa)
                        }
                    } else if(args.length >= 1){
                        let r_numero_usuario = ""
                        for (let i = 1; i < args.length; i++){
                            r_numero_usuario += args[i]
                        }
                        r_numero_usuario = r_numero_usuario.replace(/\W+/g,"")
                        let r_registrado = await usuarios.verificarRegistro(r_numero_usuario+"@s.whatsapp.net")
                        if(r_registrado){
                            await usuarios.resetarComandosDiaUsuario(r_numero_usuario+"@s.whatsapp.net")
                            await socket.responderTexto(c, id_chat, msgs_texto.admin.r.sucesso,mensagem_completa)
                        } else {
                            await socket.responderTexto(c, id_chat, msgs_texto.admin.r.nao_registrado,mensagem_completa)
                        }
                    } else {
                        await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo),mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break  
                
            case "verdados":
                try{
                    let idUsuario = "", dadosUsuario = {}
                    if(mensagem_citada) idUsuario = citacao.remetente
                    else if(mencionados.length === 1) idUsuario = mencionados[0]
                    else if(args.length > 1) idUsuario =  args.slice(1).join("").replace(/\W+/g,"")+"@s.whatsapp.net"
                    else return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo),mensagem_completa)
                    let usuarioRegistrado = await usuarios.verificarRegistro(idUsuario)
                    if(usuarioRegistrado) dadosUsuario = await usuarios.obterDadosUsuario(idUsuario)
                    else return await socket.responderTexto(c, id_chat,msgs_texto.admin.verdados.nao_registrado,mensagem_completa)
                    let maxComandosDia = dadosUsuario.max_comandos_dia || "Sem limite"
                    let tipoUsuario = msgs_texto.tipos[dadosUsuario.tipo]
                    let nomeUsuario =  dadosUsuario.nome || "Ainda não obtido"
                    let resposta = criarTexto(msgs_texto.admin.verdados.resposta_superior, nomeUsuario, tipoUsuario, dadosUsuario.id_usuario.replace("@s.whatsapp.net",""))
                    if(botInfo.limite_diario.status) resposta += criarTexto(msgs_texto.admin.verdados.resposta_variavel.limite_diario.on, dadosUsuario.comandos_dia, maxComandosDia, maxComandosDia)
                    resposta += criarTexto(msgs_texto.admin.verdados.resposta_inferior, dadosUsuario.comandos_total)
                    await socket.responderTexto(c, id_chat, resposta, mensagem_completa)
                } catch(err){
                    throw err
                }
                break
                     
            case 'bcgrupos':
                try{
                    if(args.length === 1) return socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let mensagem = texto_recebido.slice(10).trim(), gruposAtuais = await grupos.obterTodosGruposInfo()
                    await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.bcgrupos.espera, gruposAtuais.length, gruposAtuais.length) , mensagem_completa)
                    for (let grupo of gruposAtuais) {
                        if (!grupo.restrito_msg) {
                            await new Promise((resolve)=>{
                                setTimeout(async ()=>{
                                    await socket.enviarTexto(c, grupo.id_grupo, criarTexto(msgs_texto.admin.bcgrupos.anuncio, mensagem)).catch(()=>{})
                                    resolve()
                                }, 1000)
                            })
                        }
                    }
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.bcgrupos.bc_sucesso , mensagem_completa)
                } catch(err){
                    throw err
                }
                break
            
            case "grupos":
                try{
                    let gruposAtuais = await grupos.obterTodosGruposInfo(), resposta = criarTexto(msgs_texto.admin.grupos.resposta_titulo, gruposAtuais.length)
                    let numGrupo = 0
                    for (let grupo of gruposAtuais){
                        numGrupo++
                        let adminsGrupo = grupo.admins
                        let botAdmin = adminsGrupo.includes(numero_bot)
                        let comandoLink = botAdmin ? `${prefixo}linkgrupo ${numGrupo}` : '----'
                        resposta += criarTexto(msgs_texto.admin.grupos.resposta_itens, numGrupo, grupo.nome, grupo.participantes.length, adminsGrupo.length,  botAdmin ? "Sim" : "Não",  comandoLink)
                    }
                    await socket.responderTexto(c, id_chat, resposta, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case 'linkgrupo':
                try{
                    let gruposAtuais = await grupos.obterTodosGruposInfo()
                    let indexGrupo = texto_recebido.slice(11).trim()
                    if(isNaN(indexGrupo)) return await socket.responderTexto(c, id_chat, msgs_texto.admin.linkgrupo.nao_encontrado, mensagem_completa)
                    indexGrupo = parseInt(indexGrupo) - 1
                    if(!gruposAtuais[indexGrupo]) return await socket.responderTexto(c, id_chat, msgs_texto.admin.linkgrupo.nao_encontrado, mensagem_completa)
                    let botAdmin = gruposAtuais[indexGrupo].admins.includes(numero_bot)
                    if(!botAdmin) return await socket.responderTexto(c, id_chat, msgs_texto.admin.linkgrupo.nao_admin, mensagem_completa)
                    let link = await socket.obterLinkGrupo(c, gruposAtuais[indexGrupo].id_grupo)
                    await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.admin.linkgrupo.resposta, link), mensagem_completa)               
                } catch(err){
                    throw err
                }
                break

            case 'estado':
                try{
                    if(args.length != 2) return await socket.responderTexto(c, id_chat,erroComandoMsg(comando, botInfo),mensagem_completa)
                    switch(args[1]){
                        case 'online':
                            await socket.alterarStatusPerfil(c, "< 🟢 Online />")
                            await socket.responderTexto(c, id_chat,msgs_texto.admin.estado.sucesso,mensagem_completa)
                            break
                        case 'offline':
                            await socket.alterarStatusPerfil(c, "< 🔴 Offline />")
                            await socket.responderTexto(c, id_chat,msgs_texto.admin.estado.sucesso,mensagem_completa)
                            break    
                        case 'manutencao':
                            await socket.alterarStatusPerfil(c, "< 🟡 Manutenção />")
                            await socket.responderTexto(c, id_chat,msgs_texto.admin.estado.sucesso,mensagem_completa)
                            break
                        default:
                            await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break

            case 'desligar':
                try{
                    await socket.responderTexto(c, id_chat, msgs_texto.admin.desligar.sucesso, mensagem_completa).then(async()=>{
                        await socket.encerrarBot(c)
                    })
                } catch(err){
                    throw err
                }
                break
            
            case "ping":
                try{
                    let tempoResposta = (moment.now()/1000) - t
                    let memoriaTotal = os.totalmem()/1024000000, memoriaUsada = (os.totalmem() - os.freemem())/1024000000
                    let sistemaOperacional = `${os.type()} ${os.release()}`
                    let nomeProcessador = os.cpus()[0].model
                    let gruposAtuais = await grupos.obterTodosGruposInfo()
                    let contatos = await usuarios.obterDadosTodosUsuarios()
                    await socket.responderTexto(c, id_chat, criarTexto(
                    msgs_texto.admin.ping.resposta, 
                    sistemaOperacional, 
                    nomeProcessador, 
                    memoriaUsada.toFixed(2), 
                    memoriaTotal.toFixed(2), 
                    tempoResposta.toFixed(3),
                    contatos.length,
                    gruposAtuais.length,
                    timestampParaData(botInfo.iniciado)), mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case 'devtest':
                try{
                    //PARA TESTES
                } catch(err){
                    throw err
                }
                break
        }
    } catch(err){
        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.geral.erro_comando_codigo, comando), mensagem_completa)
        err.message = `${comando} - ${err.message}`
        consoleErro(err, "ADMIN")
    }
    
}