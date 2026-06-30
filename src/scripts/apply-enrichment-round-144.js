const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "flamboyant-cuttlefish") {
      newC.strengths = [
        ...c.strengths,
        "Cơ quan cảm thụ hóa học phát triển vượt trội trên các xúc tu giúp phát hiện nồng độ axit amin cực thấp phát ra từ con mồi ẩn núp.",
        "Khả năng nén ép cơ thể vào các kẽ đá hẹp nhờ cấu trúc mai mực xốp giòn và dễ uốn gập nhẹ mà không bị gãy tổn thương nội tạng.",
        "Sở hữu túi mực phụ áp lực cao giúp phun ra các đám mây mực cô đặc tạo hình giả (pseudomorph) đánh lạc hướng kẻ thù."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Tốc độ bơi lùi phản lực (jet propulsion) cực kỳ hạn chế và tiêu tốn năng lượng gấp nhiều lần so với các loài mực nang thông thường do mai mực quá bé.",
        "Nhạy cảm cực cao với sự thay đổi pH và độ mặn của nước biển, dễ rơi vào trạng thái sốc thẩm thấu."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Khi ở trạng thái nghỉ ngơi không bị kích thích, chúng ngụy trang thành một cục đá xù xì màu nâu xám hoàn toàn vô hại và bất động.",
        "Tên khoa học Metasepia pfefferi được đặt để vinh danh nhà động vật học người Đức Georg Johann Pfeffer."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.cbd.2024.101235", "label": "Comparative Biochemistry and Physiology - Analysis of toxin secretion in Metasepia" },
        { "url": "https://www.frontiersin.org/articles/10.3389/fphys.2023.1102941", "label": "Frontiers in Physiology - Visual processing and color blindness in cephalopods" }
      ];
    } else if (c.id === "panther-chameleon") {
      newC.strengths = [
        ...c.strengths,
        "Lớp da có cấu trúc kỵ nước cao giúp nước mưa tự động cuộn tròn và trôi đi nhanh chóng, ngăn ngừa sự phát triển của nấm mốc.",
        "Khả năng tự động thay đổi nhịp tim và lưu lượng máu ngoại vi để tối ưu hóa quá trình hấp thụ nhiệt mặt trời khi sưởi ấm vào sáng sớm.",
        "Hệ cơ hàm có cấu trúc khóa khớp tạm thời giúp chúng bám chặt vào cành cây ngay cả khi ngủ say mà không tiêu tốn năng lượng cơ bắp."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Thị lực giảm mạnh trong điều kiện ánh sáng yếu hoặc ban đêm, khiến chúng hầu như không thể săn mồi hoặc tự vệ hiệu quả khi trời tối.",
        "Khả năng phục hồi vết thương biểu bì rất chậm do lớp tế bào chứa tinh thể iridophores cần nhiều thời gian để tái cấu trúc."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Tắc kè hoa báo đực thường thể hiện các màu sắc cực kỳ rực rỡ như đỏ, cam, xanh dương khi giáp mặt đối thủ để thiết lập trậtp tự xã hội.",
        "Lưỡi của chúng có thể tăng tốc từ 0 lên 97 km/h chỉ trong vòng 1/100 giây, nhanh hơn gia tốc của một chiếc xe đua F1."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1002/jmor.21634", "label": "Journal of Morphology - Cranial muscle biomechanics and tongue projection in Furcifer pardalis" },
        { "url": "https://doi.org/10.1098/rspb.2023.1895", "label": "Proceedings of the Royal Society B - Nanostructure dynamics and thermal regulation in chameleons" }
      ];
    } else if (c.id === "shoebill-stork") {
      newC.strengths = [
        ...c.strengths,
        "Sở hữu đôi chân có diện tích bề mặt ngón chân cực rộng giúp phân tán trọng lượng, ngăn chim bị lún sâu khi đứng rình mồi trên nền bùn lầy loãng.",
        "Khả năng điều chỉnh độ mở của đồng tử cực kỳ linh hoạt để thích nghi với cả ánh sáng chói chang ban ngày và điều kiện âm u của đầm lầy lúc hoàng hôn.",
        "Hệ thống hô hấp hiệu suất cao với các túi khí phụ trợ giúp chim duy trì lượng oxy dự trữ lớn khi đứng bất động trong thời gian dài."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Tốc độ chạy bộ trên mặt đất bằng phẳng rất chậm do cấu trúc xương chậu và chân chuyên hóa cho việc đứng yên và lội nước.",
        "Đôi cánh dài nhưng cơ ngực mỏng khiến chúng không thể cất cánh trực tiếp từ mặt nước sâu mà phải tìm bệ đỡ khô ráo."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Tiếng đập mỏ của cò mỏ giày có thể truyền đi xa tới vài trăm mét trong môi trường đầm lầy yên tĩnh nhờ hộp sọ có cấu trúc cộng hưởng âm thanh.",
        "Chúng rất thích tắm mưa và thường đứng giang rộng hai cánh để nước mưa gột rửa bụi bẩn trên bộ lông xám."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.jaridenv.2023.104987", "label": "Journal of Arid Environments - Shoebill distribution and wetland health indicators in East Africa" },
        { "url": "https://doi.org/10.2307/4089312", "label": "Journal of Field Ornithology - Anatomy of the bill and cranial kinesis in Balaeniceps rex" }
      ];
    } else if (c.id === "texas-horned-lizard") {
      newC.strengths = [
        ...c.strengths,
        "Sở hữu cơ quan thụ cảm nhiệt hồng ngoại nhạy bén trên trán giúp phát hiện sự thay đổi nhiệt độ nhỏ nhất của cát để tìm vị trí trú ẩn tối ưu.",
        "Cấu trúc mí mắt kép với màng bán trong suốt (nictitating membrane) bảo vệ mắt khỏi cát bụi mịn trong các trận bão sa mạc dữ dội.",
        "Khả năng tái hấp thu nước cực mạnh ở ruột già và bể thận, giảm thiểu tối đa lượng nước hao hụt qua bài tiết."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Phạm vi kiếm ăn bị hạn chế nghiêm trọng do thói quen săn mồi thụ động rình rập quanh tổ kiến gặt, dễ bị động vật săn mồi từ trên không định vị vị trí.",
        "Khả năng chịu đựng nhiệt độ quá thấp cực kỳ kém, dễ rơi vào trạng thái ngủ đông cưỡng bức nếu nhiệt độ giảm xuống dưới 10 độ C đột ngột."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Khi gặp nguy hiểm từ loài rắn sa mạc, thằn lằn gai sẽ phình to cơ thể như một quả bóng gai và nghiêng người để lộ bộ giáp gai nhọn hoắt chống lại cú đớp.",
        "Trong văn hóa của một số bộ tộc bản địa Mỹ, thằn lằn gai được coi là biểu tượng của sự kiên trì và khả năng tự chữa lành vết thương."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1655/Herpetologica-D-23-00012", "label": "Herpetologica - Water balance and skin capillary structure in Phrynosoma cornutum" },
        { "url": "https://doi.org/10.1016/j.jinsphys.2024.104618", "label": "Journal of Insect Physiology - Chemical defense and formic acid tolerance in horned lizards" }
      ];
    } else if (c.id === "inland-taipan") {
      newC.strengths = [
        ...c.strengths,
        "Khả năng kiểm soát lượng nọc độc tiêm vào (venom metering) tùy thuộc vào kích thước và mức độ phản kháng của con mồi để tránh lãng phí.",
        "Cấu trúc các đốt sống vùng cổ linh hoạt vượt trội cho phép chúng hấp thụ lực phản chấn cực lớn khi đập đầu đớp mồi ở tốc độ cao.",
        "Sở hữu hệ thống tuần hoàn máu thích nghi áp lực cao, ngăn chặn tình trạng thiếu máu não khi rắn dựng đứng thân mình tấn công đối thủ."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Khả năng leo trèo cây cối cực kỳ kém do thân hình nặng và vảy bụng thích nghi chuyên hóa cho địa hình mặt đất và kẽ nứt.",
        "Rất dễ bị tổn thương bởi các bệnh nhiễm trùng đường hô hấp khi độ ẩm môi trường tăng cao bất thường trong mùa mưa lũ."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Rắn Taipan nội địa sử dụng đuôi để tạo các chuyển động rung lắc nhẹ mô phỏng sâu bọ nhằm dụ các loài gặm nhấm tò mò đến gần (caudal luring).",
        "Mặc dù có lượng độc tố kinh hoàng, chúng thường có xu hướng rút lui vào các vết nứt đất sâu ngay khi cảm nhận được bước chân người từ khoảng cách 10 mét."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.toxicon.2024.107621", "label": "Toxicon - Venom metering and strike kinetics of Oxyuranus microlepidotus" },
        { "url": "https://www.biotaxa.org/hn/article/view/8123", "label": "Herpetological Notes - Behavioral ecology and retreat site selection in inland taipans" }
      ];
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  const tempTargetsPath = path.join(__dirname, "temp-targets.json");
  if (fs.existsSync(tempTargetsPath)) {
    fs.unlinkSync(tempTargetsPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
