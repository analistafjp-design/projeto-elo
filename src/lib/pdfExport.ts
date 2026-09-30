/**
 * Captura o conteúdo de um elemento da tela (ex.: o dashboard) como
 * imagem e monta um PDF com ele, paginando automaticamente se o
 * conteúdo for mais alto que uma página A4.
 */
export async function exportarElementoParaPdf(elementId: string, nomeArquivo: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const elemento = document.getElementById(elementId);
  if (!elemento) {
    throw new Error("Não foi possível localizar o conteúdo a ser exportado.");
  }

  const canvas = await html2canvas(elemento, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let alturaRestante = imgHeight;
  let posicaoY = 0;

  pdf.addImage(imgData, "PNG", 0, posicaoY, imgWidth, imgHeight);
  alturaRestante -= pageHeight;

  while (alturaRestante > 0) {
    posicaoY = alturaRestante - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, posicaoY, imgWidth, imgHeight);
    alturaRestante -= pageHeight;
  }

  pdf.save(nomeArquivo);
}
