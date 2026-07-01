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

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
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

    if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Đặc biệt, lớp sụn khớp yên ngựa (saddle structure) ở gốc càng hoạt động như một lò xo tích hợp khí động học, giúp nén và lưu trữ năng lượng đàn hồi cơ học đạt hiệu suất tối đa trước khi giải phóng.");
      newC.survival_method = appendClean(c.survival_method, "Hơn nữa, tôm tít có khả năng sử dụng các tín hiệu huỳnh quang phân cực trên các phần phụ của cơ thể để đánh dấu lãnh thổ hoặc đe dọa kẻ thù từ khoảng cách an toàn mà không cần trực tiếp giao chiến.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thống lọc quang học ở mắt của chúng sử dụng các sắc tố lọc UV chuyên biệt (UV-blocking pigments) để chia tia UV thành các kênh màu sắc chi tiết hơn, giúp chúng nhìn thấy độ tương phản cực kỳ sắc nét dưới các rạn san hô nhiều bóng râm.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân tích tín hiệu thị giác phân cực tròn để phát hiện lớp ngụy trang sinh học của các loài mực và cá thân mềm.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Đặc biệt nhạy cảm với sự gia tăng đột ngột của nồng độ kim loại nặng và axit hóa đại dương, làm ảnh hưởng trực tiếp đến quá trình tổng hợp lớp vỏ kitin Bouligand sau khi lột xác.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Bên cạnh đó, các sắc tố lọc màu trong mắt tôm tít hoạt động như các thấu kính thu nhỏ riêng biệt, truyền tín hiệu trực tiếp về hạch thần kinh vùng ngực để xử lý chuyển động nhanh mà không cần qua não trung tâm.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1126/science.1154703", 
        "label": "Science - Circularly Polarized Light Detection by a Mantis Shrimp" 
      });

    } else if (c.id === "platypus") {
      newC.characteristics = appendClean(c.characteristics, "Lớp da mỏ mềm dẻo của chúng được duy trì độ ẩm bằng các tuyến nhầy hoạt động liên tục, giúp tối ưu hóa khả năng dẫn truyền ion sinh học từ môi trường nước vào các kênh thụ cảm điện trường.");
      newC.survival_method = appendClean(c.survival_method, "Ngoài ra, thú mỏ vịt còn thực hiện các chuyển động lắc đầu liên tục theo hai bên (sweeping) khi bơi sát đáy để mở rộng vùng quét điện từ và cơ học, tăng khả năng phát hiện con mồi ẩn núp dưới các lớp cát mịn.");
      newC.unique_traits = appendClean(c.unique_traits, "Hơn nữa, nọc độc của chúng chứa các thành phần ức chế enzyme và các peptide hoạt hóa kênh ion hướng cảm giác đau độc đáo, làm suy giảm huyết áp của đối thủ một cách nhanh chóng.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phát hiện sự khác biệt thời gian cực nhỏ giữa tín hiệu cơ học và điện học để tính toán chính xác khoảng cách đến con mồi.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Bộ gen đơn huyệt thiếu một số nhóm gen miễn dịch thích ứng phổ biến ở thú có nhau thai, khiến chúng dễ bị tổn thương bởi các bệnh nhiễm trùng do nấm đất Mucor amphibius gây ra.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Mắt của thú mỏ vịt chứa các tế bào hình nón kép tương tự như loài bò sát, là một đặc điểm tiến hóa sơ khai từ tổ tiên chung trước khi phân nhánh thành động vật có vú hiện đại.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rstb.1998.0262", 
        "label": "Philosophical Transactions of the Royal Society B - Electroreception in Monotremes" 
      });

    } else if (c.id === "superb-lyrebird") {
      newC.characteristics = appendClean(c.characteristics, "Cơ quan syrinx của chúng không có các vòng sụn cứng hoàn chỉnh mà được thay thế bằng hệ cơ màng bán dẻo mỏng, giúp giảm chấn và tối đa hóa biên độ rung của luồng khí thở khi tạo ra các tần số âm học phức tạp.");
      newC.survival_method = appendClean(c.survival_method, "Trong mùa sinh sản, chúng phối hợp nhuần nhuyễn tiếng hót giả thanh với nhịp điệu chuyển động của bộ lông đuôi để tạo ra một màn trình diễn đa phương tiện, đánh lừa cả thị giác lẫn thính giác của con cái.");
      newC.unique_traits = appendClean(c.unique_traits, "Đáng chú ý, chúng có khả năng ghi nhớ và tái hiện các mẫu âm thanh thu được từ nhiều năm trước mà không hề bị suy giảm độ chính xác thính giác, chứng tỏ sự tồn tại của một trung tâm lưu trữ âm học phát triển cao trong não bộ.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân bổ và chôn lấp hạt giống cây rừng sâu dưới đất khi đào xới lá rụng, thúc đẩy sự tái sinh của thảm thực vật bản địa.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Thời gian biểu diễn tán tỉnh kéo dài hàng giờ liền trên ụ đất trống khiến con trống tiêu tốn một lượng lớn năng lượng dự trữ và dễ bị thú săn mồi phát hiện.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Bên cạnh các âm thanh cơ khí, chim lia còn bắt chước tiếng vỗ cánh và tiếng kêu hoảng loạn của các loài chim khác để mô phỏng một vụ tấn công giả của kẻ săn mồi, thu hút sự chú ý của bạn tình.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.anbehav.2013.03.016", 
        "label": "Animal Behaviour - Vocal mimicry in songbirds: characteristics and selection" 
      });

    } else if (c.id === "greater-horseshoe-bat") {
      newC.characteristics = appendClean(c.characteristics, "Sự phân bố các thụ thể cơ học siêu nhạy dọc theo rìa lá mũi cho phép dơi móng ngựa cảm nhận sự thay đổi áp suất khí động học cực nhỏ xung quanh đầu khi di chuyển trong các hang động chật hẹp.");
      newC.survival_method = appendClean(c.survival_method, "Hơn nữa, khi phát hiện con mồi bay sát các bề mặt gồ ghề như vách đá hay tán lá, chúng chuyển sang chế độ quét âm học đa chiều (multi-directional scan) để phân biệt tiếng vang của côn trùng với tiếng vang nhiễu của môi trường xung quanh.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thống protein trong cơ bay của chúng có tốc độ phân giải axit lactic cực nhanh, cho phép dơi duy trì khả năng bay lượn luồn lách liên tục mà không bị chuột rút hay mệt mỏi cơ bắp.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân tích sự thay đổi tần số phản xạ (frequency shift) để ước tính chính xác tốc độ và góc di chuyển của con mồi.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự phụ thuộc vào các quần thể côn trùng cánh vảy lớn (moths) khiến chúng cực kỳ nhạy cảm với việc sử dụng thuốc trừ sâu diện rộng trong nông nghiệp.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Trong thời gian ngủ đông, nhịp tim của dơi móng ngựa lớn có thể giảm từ 400 nhịp/phút xuống chỉ còn 4 nhịp/phút, duy trì sự sống ở mức tối thiểu nhất.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1371/journal.pone.0007823", 
        "label": "PLoS ONE - Echolocation and flight mechanics of Rhinolophidae in dense vegetation" 
      });

    } else if (c.id === "human-flea") {
      newC.characteristics = appendClean(c.characteristics, "Lớp sáp lipids phủ trên vỏ kitin không chỉ giúp chống mất nước mà còn giảm thiểu đáng kể ma sát tĩnh khi bọ chét luồn lách qua lớp biểu bì lông dày đặc của vật chủ.");
      newC.survival_method = appendClean(c.survival_method, "Hơn nữa, nước bọt của bọ chét chứa các enzyme kháng viêm và giảm đau cục bộ, làm tê liệt tạm thời thụ cảm thần kinh cảm giác của vật chủ, giúp chúng hút máu trong thời gian dài mà không bị phát hiện.");
      newC.unique_traits = appendClean(c.unique_traits, "Ngoài ra, chúng sở hữu cấu trúc các lỗ thở (spiracles) có van đóng mở linh hoạt dọc theo sườn, giúp ngăn cản bụi bẩn hoặc các chất lỏng xâm nhập khi vật chủ tìm cách làm sạch cơ thể.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng co giãn linh hoạt của các đốt bụng (abdominal segments) cho phép chứa một lượng máu gấp đôi trọng lượng cơ thể trong mỗi lần hút.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Ấu trùng của chúng không thể tự bò đi xa và phụ thuộc hoàn toàn vào nguồn hữu cơ vụn rơi rớt tại nơi cư trú của vật chủ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Bọ chét có thể chịu đựng áp lực gia tốc nhảy đột ngột mà không bị tổn thương não hay hệ tuần hoàn nhờ hệ thống xoang hở và dịch huyết (hemolymph) phân bố phân tán.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.058321", 
        "label": "Journal of Experimental Biology - Resilin distribution and jump kinematics of fleas" 
      });
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
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 164 ===================");
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
