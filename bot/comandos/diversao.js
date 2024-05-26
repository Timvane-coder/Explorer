//REQUERINDO MODULOS
import {criarTexto, primeiraLetraMaiuscula, erroComandoMsg, consoleErro, timestampParaData} from '../lib/util.js'
import path from 'node:path'
import api from '../../api/api.js'
import * as socket from '../baileys/socket.js'
import { MessageTypes } from '../baileys/mensagem.js'
import {obterMensagensTexto} from '../lib/msgs.js'


export const diversao = async(c, mensagemBaileys, botInfo) => {
    //Atribuição de valores
    const msgs_texto = obterMensagensTexto(botInfo)
    const {prefixo, hostNumber: numero_bot, numero_dono} = botInfo
    const {
        comando,
        texto_recebido,
        args,
        mensagem_completa,
        id_chat,
        mensagem_grupo,
        mensagem_citada,
        mencionados,
        citacao,
        grupo
    } = mensagemBaileys
    const {dono, usuario_admin, bot_admin} = {...grupo}
    const comandoSemPrefixo = comando.replace(prefixo, "")

    //Comandos de diversão
    try {
        switch(comandoSemPrefixo){
            case 'detector' :
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(!mensagem_citada) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    let imgsDetector = ['verdade','vaipra','mentiroso','meengana','kao','incerteza','estresse','conversapraboi']
                    let indexAleatorio = Math.floor(Math.random() * imgsDetector.length)
                    await socket.responderArquivoLocal(c,MessageTypes.image, id_chat, './bot/midia/detector/calibrando.png', msgs_texto.diversao.detector.espera, mensagem_completa)
                    await socket.responderArquivoLocal(c,MessageTypes.image, id_chat, `./bot/midia/detector/${imgsDetector[indexAleatorio]}.png`, '', citacao.mensagem_citacao)
                } catch(err){
                    throw err
                }
                break

            case 'simi':
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let perguntaSimi = texto_recebido.slice(6).trim()
                    await api.IA.simiResponde(perguntaSimi).then(async ({resultado})=>{
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.diversao.simi.resposta, timestampParaData(Date.now()), resultado), mensagem_completa)
                    }).catch(async(err)=>{
                        if(!err.erro) throw err
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.geral.erro_api, comando, err.erro) , mensagem_completa)
                    })
                } catch(err){
                    throw err
                }
                break
            
            case 'viadometro' :
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(!mensagem_citada && mencionados.length == 0) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    if(mencionados.length > 1) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.viadometro.apenas_um, mensagem_completa)
                    let respostas = msgs_texto.diversao.viadometro.respostas
                    let indexAleatorio = Math.floor(Math.random() * respostas.length), idResposta = null, alvo = null
                    if(mencionados.length == 1) idResposta = mensagem_completa, alvo = mencionados[0]
                    else idResposta = citacao.mensagem_citacao, alvo = citacao.remetente
                    if(numero_dono == alvo) indexAleatorio = 0
                    let respostaTexto = criarTexto(msgs_texto.diversao.viadometro.resposta,respostas[indexAleatorio])
                    await socket.responderTexto(c, id_chat, respostaTexto, idResposta)
                } catch(err){
                    throw err
                }
                break
            
            case 'bafometro' :
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(!mensagem_citada && mencionados.length == 0) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    if (mencionados.length > 1) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.bafometro.apenas_um, mensagem_completa)
                    let respostas = msgs_texto.diversao.bafometro.respostas
                    let indexAleatorio = Math.floor(Math.random() * respostas.length), idResposta = null, alvo = null
                    if(mencionados.length == 1) idResposta = mensagem_completa, alvo = mencionados[0]
                    else idResposta = citacao.mensagem_citacao, alvo = citacao.remetente
                    if(numero_dono == alvo) indexAleatorio = 0
                    let respostaTexto = criarTexto(msgs_texto.diversao.bafometro.resposta, respostas[indexAleatorio])
                    await socket.responderTexto(c, id_chat, respostaTexto, idResposta)
                } catch(err){
                    throw err
                }
                break

            case 'chance' :
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let num = Math.floor(Math.random() * 100), temaChance = texto_recebido.slice(8).trim()
                    if(mensagem_citada){ 
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.diversao.chance.resposta, num, temaChance), citacao.mensagem_citacao)
                    } else {
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.diversao.chance.resposta, num, temaChance), mensagem_completa)
                    }
                } catch(err){
                    throw err
                }
                break

            case "caracoroa":
                try{
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let ladosMoeda = ["cara","coroa"]
                    let textoUsuario = texto_recebido.slice(11).toLowerCase().trim()
                    if(!ladosMoeda.includes(textoUsuario)) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    await socket.responderTexto(c, id_chat, msgs_texto.diversao.caracoroa.espera, mensagem_completa)
                    let indexAleatorio = Math.floor(Math.random() * ladosMoeda.length)
                    let vitoriaUsuario = ladosMoeda[indexAleatorio] == textoUsuario
                    let textoResultado
                    if(vitoriaUsuario){
                        textoResultado = criarTexto(msgs_texto.diversao.caracoroa.resposta.vitoria, primeiraLetraMaiuscula(ladosMoeda[indexAleatorio]))
                    } else {
                        textoResultado = criarTexto(msgs_texto.diversao.caracoroa.resposta.derrota, primeiraLetraMaiuscula(ladosMoeda[indexAleatorio]))
                    }
                    await socket.responderArquivoUrl(c, MessageTypes.image, id_chat, path.resolve(`bot/midia/caracoroa/${ladosMoeda[indexAleatorio]}.png`), textoResultado, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "ppt":
                try{
                    let ppt = ["pedra","papel","tesoura"], indexAleatorio = Math.floor(Math.random() * ppt.length)
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    if(!ppt.includes(args[1].toLowerCase())) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.ppt.opcao_erro, mensagem_completa)
                    let escolhaBot = ppt[indexAleatorio], iconeEscolhaBot = null, escolhaUsuario = args[1].toLowerCase(), iconeEscolhaUsuario = null, vitoriaUsuario = null
                    if(escolhaBot == "pedra"){
                        iconeEscolhaBot = "✊"
                        if(escolhaUsuario == "pedra") vitoriaUsuario = null, iconeEscolhaUsuario = "✊"
                        if(escolhaUsuario == "tesoura") vitoriaUsuario = false, iconeEscolhaUsuario = "✌️"
                        if(escolhaUsuario == "papel") vitoriaUsuario = true, iconeEscolhaUsuario = "✋"
                    } else if(escolhaBot == "papel"){
                        iconeEscolhaBot = "✋"
                        if(escolhaUsuario == "pedra") vitoriaUsuario = false, iconeEscolhaUsuario = "✊"
                        if(escolhaUsuario == "tesoura") vitoriaUsuario = true, iconeEscolhaUsuario = "✌️"
                        if(escolhaUsuario == "papel") vitoriaUsuario = null, iconeEscolhaUsuario = "✋"
                    } else  {
                        iconeEscolhaBot = "✌️"
                        if(escolhaUsuario == "pedra") vitoriaUsuario = true, iconeEscolhaUsuario = "✊"
                        if(escolhaUsuario == "tesoura") vitoriaUsuario = null, iconeEscolhaUsuario = "✌️"
                        if(escolhaUsuario == "papel") vitoriaUsuario = false, iconeEscolhaUsuario = "✋"
                    }
                    let textoResultado = ''
                    if(vitoriaUsuario == true) {
                        textoResultado = criarTexto(msgs_texto.diversao.ppt.resposta.vitoria, iconeEscolhaUsuario, iconeEscolhaBot)
                    }else if(vitoriaUsuario == false){
                        textoResultado = criarTexto(msgs_texto.diversao.ppt.resposta.derrota, iconeEscolhaUsuario, iconeEscolhaBot)
                    } else {
                        textoResultado = criarTexto(msgs_texto.diversao.ppt.resposta.empate, iconeEscolhaUsuario, iconeEscolhaBot)
                    }
                    await socket.responderTexto(c, id_chat, textoResultado, mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case "massacote":
            case 'mascote':
                try{
                    const mascoteFotoURL = "https://i.imgur.com/mVwa7q4.png"
                    await socket.responderArquivoUrl(c, MessageTypes.image,id_chat, mascoteFotoURL, 'Whatsapp Jr.', mensagem_completa)
                } catch(err){
                    throw err
                }
                break 

            case 'malacos':
                try{
                    const malacosFotoURL = "https://i.imgur.com/7bcn2TK.jpg"
                    await socket.responderArquivoUrl(c, MessageTypes.image, id_chat, malacosFotoURL,'Somos o problema', mensagem_completa)
                } catch(err){
                    throw err
                }
                break

            case 'roletarussa':
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if (!usuario_admin) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.apenas_admin , mensagem_completa)
                    if (!bot_admin) return await socket.responderTexto(c, id_chat,msgs_texto.permissao.bot_admin, mensagem_completa)
                    let idParticipantesAtuais = grupo.participantes
                    if(dono == numero_bot)  idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(numero_bot),1)
                    else {
                        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(dono),1)
                        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(numero_bot),1)
                    }
                    if(idParticipantesAtuais.length == 0) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.roletarussa.sem_membros, mensagem_completa)
                    let indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length)
                    let participanteEscolhido = idParticipantesAtuais[indexAleatorio]
                    let respostaTexto = criarTexto(msgs_texto.diversao.roletarussa.resposta, participanteEscolhido.replace("@s.whatsapp.net", ''))
                    await socket.responderTexto(c, id_chat, msgs_texto.diversao.roletarussa.espera , mensagem_completa)
                    await socket.enviarTextoComMencoes(c, id_chat, respostaTexto, [participanteEscolhido])
                    await socket.removerParticipante(c, id_chat, participanteEscolhido)
                } catch(err){
                    throw err
                }
                break
            
            case 'casal':
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    let idParticipantesAtuais = grupo.participantes
                    if(idParticipantesAtuais.length < 2) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.casal.minimo, mensagem_completa)
                    let indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length)
                    let pessoaEscolhida1 = idParticipantesAtuais[indexAleatorio]
                    idParticipantesAtuais.splice(indexAleatorio,1)
                    indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length)
                    let pessoaEscolhida2 = idParticipantesAtuais[indexAleatorio]
                    let respostaTexto = criarTexto(msgs_texto.diversao.casal.resposta, pessoaEscolhida1.replace("@s.whatsapp.net", ''), pessoaEscolhida2.replace("@s.whatsapp.net", ''))
                    await socket.enviarTextoComMencoes(c, id_chat, respostaTexto, [pessoaEscolhida1, pessoaEscolhida2])
                } catch(err){
                    throw err
                }
                break

            case 'gadometro':
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(!mensagem_citada && mencionados.length == 0) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    if(mencionados.length > 1) return await socket.responderTexto(c, id_chat, msgs_texto.diversao.gadometro.apenas_um , mensagem_completa)
                    let respostas = msgs_texto.diversao.gadometro.respostas 
                    let indexAleatorio = Math.floor(Math.random() * respostas.length), idResposta = null, alvo = null
                    if (mencionados.length == 1) idResposta = mensagem_completa, alvo = mencionados[0]
                    else idResposta = citacao.mensagem_citacao, alvo = citacao.remetente
                    if(numero_dono == alvo) indexAleatorio = 0
                    let respostaTexto = criarTexto(msgs_texto.diversao.gadometro.resposta, respostas[indexAleatorio])
                    await socket.responderTexto(c, id_chat, respostaTexto, idResposta)       
                } catch(err){
                    throw err
                }
                break

            case 'top5':
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(args.length === 1) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo), mensagem_completa)
                    let temaRanking = texto_recebido.slice(6).trim(), idParticipantesAtuais = grupo.participantes
                    if(idParticipantesAtuais.length < 5) return await socket.responderTexto(c, id_chat,msgs_texto.diversao.top5.erro_membros, mensagem_completa)
                    let respostaTexto = criarTexto(msgs_texto.diversao.top5.resposta_titulo, temaRanking), mencionarMembros = []
                    for (let i = 0 ; i < 5 ; i++){
                        let medalha = ""
                        switch(i+1){
                            case 1:
                                medalha = '🥇'
                            break
                            case 2:
                                medalha = '🥈'
                            break
                            case 3:
                                medalha = '🥉'
                            break
                            default:
                                medalha = ''
                        }
                        let indexAleatorio = Math.floor(Math.random() * idParticipantesAtuais.length)
                        let membroSelecionado = idParticipantesAtuais[indexAleatorio]
                        respostaTexto += criarTexto(msgs_texto.diversao.top5.resposta_itens, medalha, i+1, membroSelecionado.replace("@s.whatsapp.net", ''))
                        mencionarMembros.push(membroSelecionado)
                        idParticipantesAtuais.splice(idParticipantesAtuais.indexOf(membroSelecionado),1)                
                    }
                    await socket.enviarTextoComMencoes(c, id_chat, respostaTexto, mencionarMembros)
                } catch(err){
                    throw err
                }
                break

            case 'par':
                try{
                    if (!mensagem_grupo) return await socket.responderTexto(c, id_chat, msgs_texto.permissao.grupo, mensagem_completa)
                    if(mencionados.length !== 2) return await socket.responderTexto(c, id_chat, erroComandoMsg(comando, botInfo) , mensagem_completa)
                    let respostas = msgs_texto.diversao.par.respostas
                    let indexAleatorio = Math.floor(Math.random() * respostas.length)
                    let respostaTexto = criarTexto(msgs_texto.diversao.par.resposta, mencionados[0].replace("@s.whatsapp.net", ''), mencionados[1].replace("@s.whatsapp.net", ''), respostas[indexAleatorio])
                    await socket.enviarTextoComMencoes(c, id_chat, respostaTexto, mencionados)
                } catch(err){
                    throw err
                }
                break

            case "fch":
                try{
                    await api.Gerais.obterCartasContraHu().then(async({resultado})=>{
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.diversao.fch.resposta, resultado), mensagem_completa)
                    }).catch(async err=>{
                        if(!err.erro) throw err
                        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.geral.erro_api, comando, err.erro) , mensagem_completa)
                    })
                } catch(err){
                    throw err
                }
                break    
        }
    } catch(err){
        await socket.responderTexto(c, id_chat, criarTexto(msgs_texto.geral.erro_comando_codigo, comando), mensagem_completa)
        err.message = `${comando} - ${err.message}`
        consoleErro(err, "DIVERSÃO")
    }
    
}