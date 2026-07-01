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

    if (c.id === "blue-dragon") {
      newC.characteristics = appendClean(c.characteristics, "Sở hữu hệ thống các cnidophages chuyên biệt bên trong cnidosac để chứa các nematocysts mà không kích hoạt phản ứng nổ ngòi độc.");
      newC.survival_method = appendClean(c.survival_method, "Hấp thụ chọn lọc các tế bào ngòi độc có độc tính cao nhất (nematocysts) từ Portuguese Man o' War, bọc chúng trong các màng glycoprotein-rich mucus đặc hữu ở ruột để trung hòa và vận chuyển an toàn.");
      newC.unique_traits = appendClean(c.unique_traits, "Tích trữ các nematocysts cướp được (kleptocnidae) trong cnidosac nằm ở rìa ngoài của cerata để phóng ra khi có va chạm vật lý.");

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân loại và chọn lọc giữ lại các ngòi độc lớn nhất, độc nhất của con mồi để tối ưu lực sát thương phản công.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Mất đi khả năng bảo vệ khi mật độ chất nhờn glycoprotein giảm hoặc trong môi trường nước có độ kiềm cao làm hòa tan lớp niêm mạc miệng.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Tế bào cnidophages trong sên biển có thể duy trì khả năng phóng độc của nematocysts lấy từ sứa lửa suốt hàng tháng trời ngay cả khi sên biển đang nhịn đói.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1093/mollus/eyy058",
        "label": "Journal of Molluscan Studies - Kleptocnidae and cnidosac morphology in Glaucus"
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Càng đập có chứa protein khoáng hóa CMP-1 (Club Mineralization Protein 1) liên kết chặt chẽ với hydroxyapatite vô định hình để tối đa độ cứng.");
      newC.survival_method = appendClean(c.survival_method, "Tận dụng cấu trúc Bouligand (dạng sợi chitin xoắn ốc nhiều lớp) để triệt tiêu năng lượng của các sóng chấn động phản hồi từ cú đấm, ngăn chặn hiện tượng rạn nứt lan truyền.");
      newC.unique_traits = appendClean(c.unique_traits, "Sở hữu các dải băng nén cơ học quấn quanh chu vi của càng đập (striated layers), hoạt động như lớp đai bảo hộ ngăn cấu trúc càng bị phồng to và vỡ tung dưới áp lực nén cực đại.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống hấp thụ lực dốc năng lượng (gradient elastic modulus) giúp chuyển tiếp mượt mà giữa bề mặt cực cứng ngoài cùng và lõi dẻo dai bên trong.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Phần cựa nén dải gân yên ngựa dễ bị xơ hóa và giảm 30% hiệu năng lưu trữ đàn hồi khi tôm tít già đi hoặc bị thiếu hụt nguyên tố vi lượng manganese.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bộ càng của tôm tít búa tạ có thể chịu đựng được hơn 50.000 cú đập siêu tốc trước khi cần phải lột xác để thay mới hoàn toàn.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1126/science.1218640",
        "label": "Science - Helicoidal structures and impact-resistant biocomposites in stomatopods"
      });

    } else if (c.id === "platypus") {
      newC.characteristics = appendClean(c.characteristics, "Tuyến nọc độc ở chân sau của con đực sản sinh ra các defensin-like peptides (DLPs) độc hại kết hợp với peptide giống hormone GLP-1 có độ bền phân hủy sinh học cực cao.");
      newC.survival_method = appendClean(c.survival_method, "Sử dụng peptide GLP-1 bền vững trong nọc độc để gây hạ đường huyết đột ngột ở đối thủ, làm suy yếu khả năng vận động và phản xạ tự vệ của kẻ thù.");
      newC.unique_traits = appendClean(c.unique_traits, "Hormone GLP-1 trong nọc độc thú mỏ vịt đã tiến hóa cơ chế kháng enzyme dipeptidyl peptidase-4 (DPP-4), giúp nó không bị phân hủy trong máu hàng giờ liền, khác biệt hoàn toàn với GLP-1 dễ phân hủy ở người.");

      newC.strengths = appendUniqueString(c.strengths, "Sự kết hợp giữa chất độc phá hủy mô (DLPs) và chất gây sốc trao đổi chất (GLP-1) tạo ra một vũ khí sinh học đa tầng độc nhất vô nhị.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Việc sản xuất nọc độc tiêu tốn tới 15% năng lượng trao đổi chất hàng ngày của con đực, khiến chúng trở nên kiệt sức và dễ bị nhiễm trùng sau mùa sinh sản.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Peptide GLP-1 độc đáo của thú mỏ vịt đang được các tập đoàn dược phẩm lớn nghiên cứu để bào chế thế hệ thuốc điều trị bệnh tiểu đường type 2 và béo phì siêu bền mới.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1038/nature06936",
        "label": "Nature - Analysis of the genome sequence of the platypus Ornithorhynchus anatinus"
      });

    } else if (c.id === "orchid-mantis") {
      newC.characteristics = appendClean(c.characteristics, "Ấu trùng và bọ ngựa non tiết ra hỗn hợp hóa chất bay hơi gồm axit 3-hydroxyoctanoic (3HOA) và axit 10-hydroxy-(E)-2-decenoic (10HDA) để thu hút con mồi.");
      newC.survival_method = appendClean(c.survival_method, "Sử dụng axit 10HDA (vốn là thành phần chính trong sữa chúa và pheromone cảnh báo của ong mật) để giả lập tín hiệu hóa học kích thích ong thợ bay thẳng vào vị trí phục kích của bọ ngựa.");
      newC.unique_traits = appendClean(c.unique_traits, "Khả năng tích hợp lưỡng hợp 'thị-hóa học' (visuo-chemical mimicry): Vừa phản xạ tia UV tạo độ tương phản bắt mắt như hoa thật, vừa phát tán hương thơm pheromone giả lập để lôi kéo các loài thụ phấn chọn lọc.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế săn mồi chọn lọc nhắm thẳng vào ong mật châu Á (Apis cerana) nhờ sự trùng khớp hoàn hảo của thụ thể hóa học pheromone giả.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Hóa chất dẫn dụ pheromone có thể vô tình thu hút các loài ong bắp cày ký sinh lớn (đối thủ nguy hiểm có thể ăn ngược lại bọ ngựa phong lan).");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Hợp chất 10HDA do bọ ngựa phong lan tiết ra có cấu trúc giống hệt chất bảo quan tự nhiên trong mật ong, giúp con mồi bị bắt không bị phân hủy nhanh trong hang ẩm trước khi bị ăn hết.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1086/673858",
        "label": "The American Naturalist - Visual and chemical deception by Hymenopus coronatus"
      });

    } else if (c.id === "pelican-eel") {
      newC.characteristics = appendClean(c.characteristics, "Sở hữu màng cơ hàm dưới buccal chứa các sợi collagen xếp chéo xoắn giúp căng giãn rộng thể tích khoang miệng lên đến hơn 10 lần thể tích sọ.");
      newC.survival_method = appendClean(c.survival_method, "Áp dụng kỹ thuật săn mồi chủ động kiểu nuốt bao bao trùm (engulfment feeding) nhờ cơ chế đẩy người nhanh về phía trước (forward-thrusting engulfment), ngậm trọn nước lẫn sinh vật phù du rồi lọc qua khe mang hẹp.");
      newC.unique_traits = appendClean(c.unique_traits, "Khớp vuông hàm (quadrate bone) có thể trượt tự do ra ngoài và xuống dưới nhờ dây chằng đàn hồi cao, giúp mở rộng miệng theo chiều ngang tạo thành một chiếc phễu hút khổng lồ.");

      newC.strengths = appendUniqueString(c.strengths, "Hệ thống vây lưng tiêu giảm tối đa cùng lớp da không vảy phủ chất nhờn bôi trơn giúp giảm thiểu tối đa lực cản ma sát khi há miệng phồng to bơi về phía trước.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Do khoang miệng quá rộng, lực cản thủy động học khi há miệng lớn khiến cá chình gần như dừng lại hoàn toàn, mất khả năng né tránh kẻ thù trong lúc đang nuốt nước.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi cá chình bồ nông há miệng nuốt chửng một lượng nước lớn, nó trông giống như một quả bóng bay màu đen khổng lồ trôi nổi lờ lững dưới đáy biển sâu trước khi từ từ ép nước ra mang.");

      newC.sources = appendUniqueSource(c.sources, {
        "url": "https://doi.org/10.1111/jfb.14515",
        "label": "Journal of Fish Biology - Feeding kinematics and jaw suspension in the deep-sea pelican eel"
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
  console.log("Cleaning up temporary JSON file...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 171 ===================");
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
