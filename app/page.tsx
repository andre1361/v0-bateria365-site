"use client" // Adicionado para permitir interatividade no cliente

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Users,
  Target,
  TrendingUp,
  Zap,
  Car,
  Battery,
  MessageSquare,
  Award,
  Plane,
  Play,
} from "lucide-react"
import Image from "next/image"
import { ContactForm } from "@/components/contact-form" // Importe o ContactForm
import { WhatsAppFloat } from "@/components/whatsapp-float" // Importe o WhatsAppFloat

export default function BateriaLandingPage() {
  // Defina os dados dos treinamentos para facilitar a duplicação
  const trainings = [
    {
      city: "Caxias do Sul/RS",
      date: "24 de Junho de 2025",
      distributor: "Distribuidor Rodmaster",
    },
    {
      city: "Porto Alegre/RS",
      date: "25 de Junho de 2025",
      distributor: "Distribuidor Rodmaster",
    },
    {
      city: "Manaus/AM",
      date: "14 e 15 de Julho de 2025",
      distributor: "Distribuidor Norte",
    },
  ]

  const scrollToContact = () => {
    const contactSection = document.getElementById("contact-section")
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - REMOVIDO */}

      {/* Hero Section */}
      <section className="text-white min-h-[800px] py-12 lg:py-20 px-2 relative overflow-hidden flex items-center bg-primary">
        {/* Background Image */}
        <div className="absolute inset-0 bg-primary">
          <Image
            src="/images/hero-background.webp"
            alt="Background de tecnologia automotiva"
            fill
            className="object-cover opacity-30"
            quality={100}
            priority
          />
        </div>

        {/* Content */}
        <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between relative z-10 gap-12">
          {/* Left Content (45%) */}
          <div className="lg:w-[45%] text-center lg:text-left">
            {/* Adicione o logo aqui */}
            <Image
              src="/images/logo-bateria365-escuro.png" // Use o logo claro para o fundo escuro da hero
              alt="Bateria 365"
              width={200} // Ajuste o tamanho conforme necessário
              height={60} // Ajuste o tamanho conforme necessário
              className="h-12 w-auto mx-auto lg:mx-0 mb-1 lg:mb-6" // mb-1 (4px) no mobile, mb-6 (24px) no desktop
            />

            {/* Imagem para Mobile - Adicionada aqui */}
            <Image
              src="/images/especialistas.webp"
              alt="Especialistas Bateria 365"
              width={600} // Largura para mobile
              height={450} // Altura para mobile
              className="rounded-lg shadow-2xl mx-auto mt-1 mb-6 block lg:hidden object-contain" // Adiciona object-contain
            />

            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Transforme seus lojistas em especialistas com o <span className="text-[#FFC700]">Bateria 365</span>
            </h1>
            <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              O mercado mudou. Seus lojistas estão prontos para esse novo cenário?
            </p>
            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto lg:mx-0 opacity-90">
              O Bateria 365 é o passo necessário para garantir que sua rede esteja preparada tecnicamente,
              comercialmente e digitalmente para enfrentar a nova geração de veículos e consumidores.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Button
                className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-lg px-8 h-16 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center whitespace-nowrap min-w-fit hover:bg-[#003A78] hover:text-[#FFC700]"
                onClick={scrollToContact}
              >
                <span className="flex items-center justify-center">
                  {" "}
                  {/* Wrapper para ícone e texto */}
                  <Zap className="mr-2 h-5 w-5" />
                  Transforme Sua Rede Agora
                </span>
              </Button>
            </div>
          </div>

          {/* Right Image (55%) - Escondido no Mobile */}
          <div className="lg:w-[55%] flex justify-center mt-12 lg:mt-0 hidden lg:flex">
            <Image
              src="/images/especialistas.webp"
              alt="Especialistas Bateria 365"
              width={800} // Ajuste a largura conforme necessário para o layout
              height={600} // Ajuste a altura conforme necessário
              className="rounded-lg object-contain" // Adiciona object-contain
            />
          </div>
        </div>
      </section>

      {/* Módulos do Treinamento */}
      <section className="py-32 px-2 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#003A78] mb-4">O que o Bateria 365 entrega</h2>
            <p className="text-xl text-gray-600">Conteúdo técnico e prático para a nova era automotiva</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Módulo 1 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Car className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">A Nova Era da Substituição</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Evolução eletrônica dos veículos e Rede CAN
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Técnicas seguras para cada tipo de veículo
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Scanner automotivo como ferramenta essencial
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Módulo 2 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Battery className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">Módulo BMS Avançado</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    BMS na comunicação com o carro
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Gerenciamento de carga e Start-Stop
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Evite falhas críticas com conhecimento preciso
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Módulo 3 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">Diagnóstico Avançado</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    SOC, SOH e resistência interna
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Decisões baseadas em dados reais
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Diagnósticos que nenhuma concorrente oferece
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Módulo 4 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Target className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">Memory Saver Seguro</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Quando usar e quando evitar
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Riscos em veículos modernos
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Casos reais analisados
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Módulo 5 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Award className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">Aplicação Correta</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Escolha ideal usando catálogo Moura
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Instalação correta em Start-Stop
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Controle de estoque com FIFO
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Módulo 6 */}
            <Card className="hover:shadow-xl transition-all border-l-4 border-[#FFC700]">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="h-8 w-8 text-[#003A78] mr-3" />
                  <h3 className="text-xl font-bold text-[#003A78]">Venda com Autoridade</h3>
                </div>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Comunicação que transmite valor
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Técnicas de vendas consultivas
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-[#FFC700] mr-2 mt-1 flex-shrink-0" />
                    Fidelização com pós-venda eficiente
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Wistia Videos Section */}
      <section className="py-32 px-2 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-[#FFC700] mr-3" />
              <h2 className="text-4xl font-bold text-[#003A78]">Conheça mais sobre o Bateria 365</h2>
            </div>
            <p className="text-xl text-gray-600">Veja como nosso treinamento transforma lojistas em especialistas</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* Primeiro Vídeo */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700]">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/3urb4uo2i2.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='3urb4uo2i2']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/3urb4uo2i2/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:56.25%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="3urb4uo2i2" aspect="1.7777777777777777"></wistia-player>
                </div>
              </CardContent>
            </Card>

            {/* Segundo Vídeo */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700]">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/jz3w50gmgo.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='jz3w50gmgo']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/jz3w50gmgo/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:56.25%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="jz3w50gmgo" aspect="1.7777777777777777"></wistia-player>
                </div>
              </CardContent>
            </Card>

            {/* Terceiro Vídeo */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700]">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/aaz5zt4757.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='aaz5zt4757']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/aaz5zt4757/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:56.25%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="aaz5zt4757" aspect="1.7777777777777777"></wistia-player>
                </div>
              </CardContent>
            </Card>

            {/* Quarto Vídeo */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700]">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/d9w8de22rt.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='d9w8de22rt']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/d9w8de22rt/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:56.25%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="d9w8de22rt" aspect="1.7777777777777777"></wistia-player>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-700 mb-6">
              Assista aos vídeos e descubra como o Bateria 365 está revolucionando o mercado de baterias automotivas
            </p>
            <Button
              className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-sm px-4 h-14 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center mx-auto whitespace-nowrap hover:bg-[#003A78] hover:text-[#FFC700] sm:text-base sm:px-6 sm:h-16 lg:text-lg lg:px-8"
              onClick={scrollToContact}
            >
              <span className="flex items-center justify-center">
                <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Quero Participar do Próximo Treinamento</span>
                <span className="sm:hidden">Participar do Treinamento</span>
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Especialistas Section - REDESIGN */}
      <section className="py-32 px-2 bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#003A78] mb-4">Quem está por trás do Bateria 365</h2>
            <p className="text-xl text-gray-600">Especialistas com mais de 50 anos de experiência combinada</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Rafael André */}
            <Card className="relative overflow-hidden border-2 border-[#FFC700] shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 flex flex-col items-center text-center">
                {/* Imagem com apresentação aprimorada */}
                <div className="relative w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-[#003A78] shadow-lg">
                  <Image
                    src="/images/rafael-andre.webp"
                    alt="Rafael André"
                    fill // Usar fill para imagens responsivas
                    className="object-cover"
                  />
                </div>
                <h3 className="text-3xl font-extrabold text-[#003A78] mb-2">Rafael André</h3>
                <p className="text-[#FFC700] font-semibold text-lg mb-4">Fundador da Sul Battery</p>
                <Badge className="bg-[#FFC700] text-[#003A78] text-base px-4 py-1 rounded-full mb-6">
                  26 anos de experiência
                </Badge>
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                  Referência nacional em especialização técnica, processos de troca padronizada e valorização
                  profissional do mercado. Criador do curso Sul Battery Pro que já capacitou pessoas em todo o Brasil.
                </p>
                <blockquote className="border-l-4 border-[#FFC700] pl-4 italic text-[#003A78] font-medium text-base bg-gray-50/50 p-4 rounded-md">
                  "Transformar uma simples troca em um serviço técnico valorizado é o que sustenta o crescimento das
                  lojas hoje."
                </blockquote>
              </CardContent>
            </Card>

            {/* Davi Barbosa */}
            <Card className="relative overflow-hidden border-2 border-[#FFC700] shadow-2xl hover:shadow-3xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="relative w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-[#003A78] shadow-lg">
                  <Image src="/images/davi-barbosa.webp" alt="Davi Barbosa" fill className="object-cover" />
                </div>
                <h3 className="text-3xl font-extrabold text-[#003A78] mb-2">Davi Barbosa</h3>
                <p className="text-[#FFC700] font-semibold text-lg mb-4">Fundador da Barbosa Baterias</p>
                <Badge className="bg-[#FFC700] text-[#003A78] text-base px-4 py-1 rounded-full mb-6">
                  28 anos de experiência
                </Badge>
                <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                  Conhecido por seu conteúdo prático e direto no Instagram, especialista em atendimento, assistência
                  técnica, pós-venda e fidelização. Já capacitou muitos lojistas pelo Brasil.
                </p>
                <blockquote className="border-l-4 border-[#FFC700] pl-4 italic text-[#003A78] font-medium text-base bg-gray-50/50 p-4 rounded-md">
                  "Atendimento consultivo é o que diferencia uma loja comum de um centro de referência."
                </blockquote>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-32 px-2 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-[#FFC700] mr-3" />
              <h2 className="text-4xl font-bold text-[#003A78]">Depoimentos</h2>
            </div>
            <p className="text-xl text-gray-600">Veja o que nossos participantes falam sobre o Bateria 365</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Primeiro Depoimento */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700] hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/yv3ssvnu7n.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='yv3ssvnu7n']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/yv3ssvnu7n/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:177.78%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="yv3ssvnu7n" aspect="0.5625"></wistia-player>
                </div>
              </CardContent>
            </Card>

            {/* Segundo Depoimento */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700] hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/peg428llob.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='peg428llob']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/peg428llob/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:177.78%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="peg428llob" aspect="0.5625"></wistia-player>
                </div>
              </CardContent>
            </Card>

            {/* Terceiro Depoimento */}
            <Card className="overflow-hidden shadow-2xl border-2 border-[#FFC700] hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-0">
                <div className="relative w-full">
                  <script src="https://fast.wistia.com/player.js" async></script>
                  <script src="https://fast.wistia.com/embed/u5e1wwdwvm.js" async type="module"></script>
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                wistia-player[media-id='u5e1wwdwvm']:not(:defined) { 
                  background: center / contain no-repeat url('https://fast.wistia.com/embed/medias/u5e1wwdwvm/swatch'); 
                  display: block; 
                  filter: blur(5px); 
                  padding-top:177.78%; 
                }
              `,
                    }}
                  />
                  <wistia-player media-id="u5e1wwdwvm" aspect="0.5625"></wistia-player>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg text-gray-700 mb-6">
              Junte-se aos profissionais que já transformaram seus negócios com o Bateria 365
            </p>
            <Button
              className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-lg px-8 h-16 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center mx-auto whitespace-nowrap hover:bg-[#003A78] hover:text-[#FFC700]"
              onClick={scrollToContact}
            >
              <span className="flex items-center justify-center">
                <Zap className="mr-2 h-5 w-5" />
                Quero Fazer Parte Também
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefícios para Distribuidores */}
      <section className="py-32 px-2 bg-gradient-to-r from-[#003A78] to-[#004A88] text-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Por que sua distribuidora deve investir no Bateria 365?</h2>
            <p className="text-xl opacity-90">Transforme sua rede em referência nacional</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFC700] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-[#003A78]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Especialistas Reais</h3>
              <p className="opacity-90">Treinamento com quem vive a prática do chão de loja</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFC700] rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-[#003A78]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Conteúdo Sob Medida</h3>
              <p className="opacity-90">Criado especificamente para a realidade do lojista de baterias</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFC700] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-[#003A78]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Equipes Capacitadas</h3>
              <p className="opacity-90">Técnicos e comerciais no mesmo nível de excelência</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFC700] rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-[#003A78]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Rede Fortalecida</h3>
              <p className="opacity-90">Aumenta valor da marca e melhora resultados das revendas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Para */}
      <section className="py-32 px-2 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#003A78] mb-4">Ideal para distribuidores que:</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="h-5 w-5 text-[#003A78]" />
              </div>
              <p className="text-lg text-gray-700">Desejam elevar o nível técnico e comercial dos lojistas parceiros</p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="h-5 w-5 text-[#003A78]" />
              </div>
              <p className="text-lg text-gray-700">Querem diminuir o retrabalho com pós-venda mal executado</p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="h-5 w-5 text-[#003A78]" />
              </div>
              <p className="text-lg text-gray-700">Buscam transformar vendedores em consultores especialistas</p>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-[#FFC700] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <CheckCircle className="h-5 w-5 text-[#003A78]" />
              </div>
              <p className="text-lg text-gray-700">Precisam preparar a rede para a realidade dos veículos modernos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Próximos Treinamentos Section - OCULTADA */}
      {/* <section className="py-32 px-2 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#003A78] mb-4">Próximos Treinamentos</h2>
            <p className="text-xl text-gray-600">Confira as próximas datas e locais para capacitar sua equipe!</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {trainings.map((training, index) => (
              <Card key={index} className="hover:shadow-xl transition-all border-l-4 border-[#003A78]">
                <CardContent className="p-6 flex flex-col items-start">
                  <Plane className="h-10 w-10 text-[#FFC700] mb-4" />
                  <div>
                    <h3 className="text-2xl font-bold text-[#003A78] mb-1">{training.city}</h3>
                    <p className="text-lg text-gray-700 mb-1">{training.date}</p>
                    <p className="text-base text-gray-600">{training.distributor}</p>
                  </div>
                  <Image src="/images/logo-moura.webp" alt="Logo Moura" width={80} height={24} className="mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Nova Seção: Condições especiais para Distribuidores Moura */}
      <section className="py-32 px-4 bg-gradient-to-br from-[#003A78] to-[#004A88] text-white">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6">Condições especiais para Distribuidores Moura</h2>
          <p className="text-xl mb-8 opacity-90">
            Se você é um distribuidor Moura, temos condições exclusivas para capacitar sua rede de lojistas com o
            Bateria 365. Fortaleça sua parceria e eleve o nível de toda a sua cadeia de valor.
          </p>
          <div className="flex justify-center mb-10">
            <Image
              src="/images/moura-branco.webp"
              alt="Logo Moura"
              width={250} // Ajuste o tamanho conforme necessário
              height={75} // Ajuste o tamanho conforme necessário
              className="object-contain"
            />
          </div>
          <Button
            className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-sm px-4 h-14 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center mx-auto whitespace-nowrap hover:bg-[#003A78] hover:text-[#FFC700] sm:text-base sm:px-6 sm:h-16 lg:text-lg lg:px-8"
            onClick={scrollToContact}
          >
            <span className="flex items-center justify-center">
              <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-center">Fale Conosco sobre as Condições Moura</span>
            </span>
          </Button>
        </div>
      </section>

      {/* Nova Seção de Contato */}
      <section id="contact-section" className="py-32 px-2 bg-gray-50">
        {" "}
        {/* Adicionado id="contact-section" */}
        <div className="container mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#003A78] mb-4">Entre em Contato</h2>
            <p className="text-xl text-gray-600">Preencha o formulário abaixo e entraremos em contato com você!</p>
          </div>
          <Card className="p-8 shadow-lg">
            <ContactForm />
          </Card>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-4 bg-gradient-to-br from-[#003A78] via-[#004A88] to-[#003A78] text-white text-center">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-5xl font-bold mb-6">O futuro do setor pertence a quem treina.</h2>
          <p className="text-2xl mb-10 opacity-90">
            Contrate o Bateria 365 para sua rede e torne-se referência nacional em especialização.
          </p>
          <Button
            className="bg-[#FFC700] text-[#003A78] rounded-full font-bold text-sm px-4 h-14 shadow-xl transform hover:scale-105 transition-all flex items-center justify-center mx-auto whitespace-nowrap hover:bg-[#003A78] hover:text-[#FFC700] sm:text-base sm:px-6 sm:h-16 lg:text-lg lg:px-8"
            onClick={scrollToContact}
          >
            <span className="flex items-center justify-center">
              {" "}
              {/* Wrapper para ícone e texto */}
              <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-center">Contratar o Bateria 365 Agora</span>
            </span>
          </Button>
          <p className="mt-6 text-lg opacity-75">Transforme sua rede em referência nacional</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#003A78] text-white py-8 px-2">
        <div className="container mx-auto text-center">
          <Image
            src="/images/logo-bateria365-escuro.png"
            alt="Bateria 365"
            width={200}
            height={60}
            className="h-12 w-auto mx-auto mb-4"
          />
          <p className="opacity-75">© 2026 Bateria 365. Todos os direitos reservados.</p>
          <p className="opacity-60 text-sm mt-2">Bateria 365 | RAC7 DIGITAL LTDA | CNPJ: 58.428.041/0001-63</p>
        </div>
      </footer>

      {/* WhatsApp Float Button */}
      <WhatsAppFloat />
    </div>
  )
}
