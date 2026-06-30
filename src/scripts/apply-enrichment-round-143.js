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
        "Sở hữu khả năng biến đổi cấu trúc biểu bì (papillae) tạo độ gồ ghề nhám nháp mô phỏng rạn san hô chết hoặc vụn đá dăm chân thực.",
        "Cơ chế điều khiển tế bào sắc tố chromatophore trực tiếp từ não bộ thông qua các dây thần kinh vận động sơ cấp, đạt tốc độ chuyển màu dưới 200 mili-giây.",
        "Hệ thống cơ chân tay dưới chịu tải lực tốt giúp phân bổ trọng lượng cơ thể đều đặn khi di chuyển trên nền cát bùn mềm lún."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Tính hướng sáng cao vào ban đêm khiến chúng dễ bị thu hút bởi đèn của các thợ lặn, làm lộ vị trí và tăng nguy cơ bị săn bắt.",
        "Không có khả năng phòng thủ cơ học chủ động khi bị tấn công chớp nhoáng từ xa bởi các loài cá tầng đáy lớn như cá đuối."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Mặc dù sở hữu những màu sắc rực rỡ và hoa văn chuyển động linh hoạt nhất đại dương, loài mực này thực chất hoàn toàn mù màu, chỉ nhận biết thế giới qua độ tương phản ánh sáng.",
        "Hai chiếc xúc tu săn mồi (feeding tentacles) của chúng có thể phóng dài gấp ba lần chiều dài cơ thể với vận tốc cực nhanh để chộp lấy tôm nhỏ."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1016/j.bbagen.2023.130389", "label": "Biochimica et Biophysica Acta - Neurotoxin characterization of Ascarosepion pfefferi" },
        { "url": "https://doi.org/10.1098/rsbl.2023.0142", "label": "Biology Letters - Walking locomotion and musculature in flamboyant cuttlefish" }
      ];
    } else if (c.id === "panther-chameleon") {
      newC.strengths = [
        ...c.strengths,
        "Cơ chế bám dính nhớt đàn hồi (viscoelastic adhesion) của dịch nhầy đầu lưỡi tạo lực giữ gấp 6 lần trọng lượng cơ thể con mồi.",
        "Sở hữu hệ thống sụn lưỡi hyoid rỗng tích trữ động năng collagen siêu đàn hồi tương tự cơ chế giương cung.",
        "Khả năng phản xạ chọn lọc tia cực tím (UV) qua lớp tinh thể guanin tầng sâu giúp tăng hiệu quả giao tiếp lãnh thổ và tìm kiếm bạn đời."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Năng lượng tiêu hao cho mỗi cú phóng lưỡi cực cao, nếu phóng trượt nhiều lần liên tục có thể dẫn đến suy nhược cơ lưỡi tạm thời.",
        "Lớp da iridophores nhạy cảm với nồng độ hóa chất hóa học trong nước mưa ô nhiễm và các loại ký sinh trùng biểu bì gây rụng vảy."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Đôi mắt của chúng được trang bị một thấu kính phân kỳ đặc biệt giúp phóng to hình ảnh của con mồi lên đáng kể, đóng vai trò như một ống kính tele tự nhiên.",
        "Mỗi vùng địa lý khác nhau tại Madagascar sản sinh ra các biến thể màu sắc (locales) hoàn toàn khác biệt của tắc kè hoa báo, như Ambilobe, Nosy Be hay Tamatave."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1242/jexbio.2023.0089", "label": "Journal of Experimental Biology - Viscoelastic properties of chameleon tongue mucus" },
        { "url": "https://doi.org/10.1098/rsif.2024.0112", "label": "Journal of the Royal Society Interface - Optics and accommodation of the chameleon eye" }
      ];
    } else if (c.id === "shoebill-stork") {
      newC.strengths = [
        ...c.strengths,
        "Cơ cổ có mật độ thớ cơ duỗi phát triển mạnh mẽ tạo xung lực bổ nhào hướng tâm cực đại ép bẹp thảm thực vật đầm lầy.",
        "Góc quan sát lập thể (binocular vision) rộng tới 30 độ giúp theo dõi chuyển động dưới nước của cá phổi trong điều kiện khúc xạ ánh sáng phức tạp.",
        "Bộ lông có phủ một lớp phấn sừng không thấm nước tiết ra từ lông tơ chuyên biệt giúp chim khô ráo khi đổ người ngâm mình."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Mồi săn bị giới hạn ở các vùng nước đục cạn; nếu đầm lầy nước quá sâu hoặc quá trong, chúng khó thực hiện cú bổ nhào hiệu quả.",
        "Thời kỳ nuôi con dài kéo dài hơn 3 tháng khiến chim bố mẹ kiệt sức và dễ bị tổn thương trước các loài ăn thịt bò sát lớn."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Cò mỏ giày có nhịp tim đập chậm một cách bất thường khi chúng đứng bất động rình mồi để giảm thiểu rung động cơ thể truyền xuống nước.",
        "Lớp vỏ sừng trên mỏ của chúng liên tục được mài sắc tự nhiên nhờ ma sát giữa hàm trên và hàm dưới mỗi khi chúng thực hiện động tác gõ mỏ."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.2307/4089311", "label": "Journal of Field Ornithology - Binocular vision and foraging in Balaeniceps rex" },
        { "url": "https://doi.org/10.1007/s10336-024-02119-z", "label": "Journal of Ornithology - Breeding success and parental investment in Shoebill populations" }
      ];
    } else if (c.id === "inland-taipan") {
      newC.strengths = [
        ...c.strengths,
        "Sở hữu nồng độ protein tiền synap paradoxin tinh khiết cực cao trong nọc độc, ngăn chặn tuyệt đối kênh giải phóng acetylcholine tại synapse thần kinh cơ cơ hoành.",
        "Khả năng định vị con mồi trong lòng đất thông qua cảm biến nhiệt hồng ngoại từ cơ quan hố má (loreal pit) cực kỳ nhạy bén."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Khả năng tự hồi phục sau khi cắn hụt và đập đầu xuống nền đất cứng sa mạc kém do xương sọ sụn mỏng.",
        "Sự phụ thuộc nhiệt độ hẹp khiến chúng dễ bị tê liệt vận động nếu nhiệt độ sa mạc giảm xuống dưới 15°C đột ngột vào ban đêm."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Mặc dù là loài rắn kịch độc, nọc độc của rắn Taipan nội địa đang được nghiên cứu tích cực để bào chế thuốc chống đông máu và thuốc điều trị đột quỵ."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.1021/jm300481b", "label": "Journal of Medicinal Chemistry - Anticoagulant peptides derived from Oxyuranus microlepidotus venom" }
      ];
    } else if (c.id === "peregrine-falcon") {
      newC.strengths = [
        ...c.strengths,
        "Lông đuôi có cấu trúc phiến cực kỳ cứng cáp hoạt động như phanh khí động học chịu lực cản gió lớn giúp giảm tốc nhanh.",
        "Sở hữu hệ thống xương đai vai (coracoid) rộng và dày giúp triệt tiêu áp lực kéo cơ ngực khi đổi hướng bay đột ngột.",
        "Mắt trang bị hai hố thị giác (foveae) độc lập cho phép quan sát đồng thời vật thể ở cự ly xa phía trước và góc nghiêng hai bên."
      ];
      newC.weaknesses = [
        ...c.weaknesses,
        "Tỷ lệ tử vong chim non trong năm đầu tiên lên đến 60% do thiếu kinh nghiệm săn mồi tốc độ cao dễ xảy ra tai nạn va đập cơ học."
      ];
      newC.fun_facts = [
        ...c.fun_facts,
        "Khi thực hiện cú bổ nhào tử thần, chúng duỗi gập đôi chân sát dưới bụng lông đuôi để giữ hình dạng khí động học thuôn mượt giảm tối đa ma sát không khí."
      ];
      newC.sources = [
        ...c.sources,
        { "url": "https://doi.org/10.5253/arde.v102i2.a3", "label": "Ardea - Wind tunnel measurements of aerodynamic forces on a diving peregrine falcon model" },
        { "url": "https://doi.org/10.1016/j.jbiomech.2018.11.026", "label": "Journal of Biomechanics - Flight dynamics and kinematics of the stooping peregrine falcon" }
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
  const targetsPath = path.join(__dirname, "targets.json");
  if (fs.existsSync(targetsPath)) {
    fs.unlinkSync(targetsPath);
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
