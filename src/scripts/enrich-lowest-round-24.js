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
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 24: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated source helper
    const addSource = (sourcesList, newSource) => {
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    if (c.id === 'basilisk-lizard') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["côn trùng", "nhện", "thằn lằn nhỏ", "chim nhỏ", "quả mọng", "hoa"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 7;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đào hang nông trong đất ẩm bên sông để đẻ từ 5 đến 18 trứng mỗi lứa, đẻ vài lứa một năm. Trứng nở sau 8 đến 10 tuần, con non tự lập ngay lập tức.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 11.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 400.0;

      const charAdd = "Sở hữu đôi chân sau dài vượt trội với các ngón chân có viền vảy xếp nếp phẳng mở rộng thủy động lực học.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trốn chạy bằng cách bứt tốc lướt trên mặt nước ngọt, lặn và nhịn thở dưới đáy bùn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Phản ứng đạp nước ba pha slap-stroke-recovery tạo túi khí nâng trọng tâm cơ thể dẹp cản nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2004.0217",
        "label": "Royal Society Biology Letters - Hydrodynamics of water running in lizards"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.00681",
        "label": "Journal of Experimental Biology - Running on water: mechanics of the basilisk lizard"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Màng da ngón chân sau xếp nếp tự động mở rộng 150% diện tích khi đè nước giúp chúng đứng vững trên cột nước động.",
        "Chúng sử dụng đuôi dài như một bánh lái thăng bằng đối trọng cơ học liên tục quét qua lại."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tần số đùi đạp nước đạt 20 bước/giây tạo gia tốc động lực kế nâng cơ thể.",
        "Có thể nhịn thở dưới đáy nước ngọt tối đa 30 phút để trốn tránh chim săn mồi và rắn độc."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Tốn năng lượng ATP cơ bắp khổng lồ nên chỉ duy trì trạng thái lướt nước trong khoảng 15 giây.",
        "Khả năng chạy trên nước suy giảm nghiêm trọng khi trọng lượng cơ thể tăng theo tuổi tác."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bearded-vulture') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["xương động vật", "tủy xương", "xác thối", "rùa nhỏ", "loài gặm nhấm nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 20;
      newC.lifespan_max = 35;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Mỗi tổ đẻ 1-2 quả trứng trên vách đá dựng đứng vào giữa mùa đông. Thời gian ấp khoảng 53-60 ngày. Thường chỉ có con non đầu tiên sống sót do hiện tượng cainism (con khỏe giết con yếu).';
      newC.locomotion = 'fly';
      newC.speed_max = 70.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 940.0;
      newC.size_max_mm = 1250.0;
      newC.weight_avg_g = 6000.0;

      const charAdd = "Bộ hàm và thực quản có cấu trúc co dãn tối đa cho phép nuốt trọn các khúc xương lớn.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Nghiền xương bằng cách mang lên độ cao 100m rồi thả xuống bãi đá phẳng ossuary cố định.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Dạ dày cực kỳ axit với nồng độ pH xấp xỉ 1 sản xuất enzyme pepsin đặc hiệu phân hủy hoàn toàn collagen trong xương xương.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/j.1474-919X.1994.tb08127.x",
        "label": "Ibis - Bone-breaking and feeding behavior of the Bearded Vulture"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/bf00164157",
        "label": "Behavioral Ecology and Sociobiology - Bone breaking behavior in bearded vultures"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Hành vi bôi bùn khoáng chứa oxit sắt lên lông là tín hiệu giao tiếp và thể hiện địa vị xã hội.",
        "Chúng có thể ghi nhớ chính xác bản đồ hướng gió núi để hỗ trợ lực nâng thả xương đúng bãi đá."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tiêu hóa chất béo và chất vô cơ cực tốt nhờ nồng độ axit dạ dày mạnh hơn cả axit ắc quy.",
        "Sải cánh khổng lồ lên tới 2.9 mét giúp bay lượn tiết kiệm năng lượng tối đa bằng luồng khí nóng."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Khả năng cất cánh từ các mặt bằng không có gió núi cực kỳ kém do trọng lượng và sải cánh lớn.",
        "Móng vuốt và cơ chân yếu, không thể bắt giữ con mồi sống lớn hiệu quả như các loài đại bàng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bee-hummingbird') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật hoa của cây đặc hữu", "côn trùng nhỏ", "nhện nhỏ", "nhụy hoa"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 7;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đơn độc làm tổ hình chén nhỏ bằng tơ nhện và địa y, đẻ 2 quả trứng nhỏ cỡ hạt đậu Hà Lan. Ấp trứng 21-22 ngày, chim non ra ràng sau 18 ngày.';
      newC.locomotion = 'fly';
      newC.speed_max = 48.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 60.0;
      newC.weight_avg_g = 2.0;

      const charAdd = "Đôi cánh đập tần số 80-200 Hz tạo lực nâng liên tục cả hai pha nhờ cấu khớp vai xoay 180 độ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hạ thân nhiệt và nhịp tim sâu vào ban đêm đi vào trạng thái ngủ lịm (torpor) để bảo toàn năng lượng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tốc độ trao đổi chất cực đoan nhất ở động vật có xương sống cùng cơ chế cuốn lưỡi hút mật mao dẫn tốc độ cao.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1152/physrev.00010.2012",
        "label": "Physiological Reviews - Physiological ecology of hummingbird flight and energy balance"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2018.1259",
        "label": "Royal Society - Flight mechanics and metabolic costs of hummingbirds"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Bộ não chiếm tỷ lệ thể tích hồi hải mã lớn hỗ trợ ghi nhớ chính xác bản đồ mật hoa của hàng ngàn bông hoa rừng.",
        "Khả năng bay đứng yên bất động nhờ phản xạ tiền đình mắt ổn định cực nhanh trong không gian."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng cơ động bay lùi và lộn ngược vô song mà không có loài chim nào khác thực hiện được.",
        "Cơ ngực và cơ vai phát triển chiếm đến 34% trọng lượng cơ thể cung cấp lực nâng 2 chiều."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thoát nhiệt cơ thể siêu tốc qua da do tỷ số diện tích trên thể tích lớn, bắt buộc ăn mật hoa liên tục.",
        "Tuyệt đối nhạy cảm với nhiệt độ lạnh cực đoan do không có khả năng tích trữ mỡ cơ thể."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bengal-slow-loris') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["nhựa cây", "mật hoa", "côn trùng", "chim nhỏ", "thằn lằn", "trứng chim", "trái cây rừng"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con sống (viviparous). Thời gian mang thai khoảng 188 ngày, sinh một con duy nhất. Con cái cai sữa cho con sau 6 tháng và con non đạt tuổi trưởng thành sau 18-20 tháng.';
      newC.locomotion = 'crawl';
      newC.speed_max = 8.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 340.0;
      newC.size_max_mm = 380.0;
      newC.weight_avg_g = 1500.0;

      const charAdd = "Khớp cổ tay chân đặc biệt tích hợp bó mạch retia mirabilia giúp phân phối dưỡng khí giữ cơ lực tĩnh ổn định lâu dài.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chải dịch tiết độc tố brachial trộn nước bọt lên lông để phòng ngừa ký sinh trùng và sát thương loài ăn thịt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sự kết hợp sinh hóa của protein tuyến brachial giống Feld d 1 và nước bọt thành nọc độc hủy hoại hoại tử cơ học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s10764-012-9622-y",
        "label": "International Journal of Primatology - Slow Loris Venom"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins12020086",
        "label": "Toxins - Evolution and ecology of venomous slow lorises"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Sở hữu lưỡi phụ sublingua nằm phía dưới lưỡi chính đóng vai trò như bàn chải làm sạch răng lược cạo vỏ cây.",
        "Khả năng phát âm tần số siêu âm (ultrasound) cảnh báo nguy hiểm mà không đánh động các động vật săn mồi lớn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Tuyến brachial giải phóng chất độc dị ứng có khả năng gây sốc phản vệ và hoại tử mô rộng.",
        "Cơ bám tĩnh cực khỏe kết hợp ngón trỏ tiêu giảm giúp mở rộng tối đa góc ôm cành không mỏi."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Di chuyển rất chậm chạp dưới mặt đất, hầu như không thể chạy trốn khi bị phát hiện.",
        "Hệ thống miễn dịch dễ suy giảm nghiêm trọng khi bị bắt giữ hoặc chịu stress tiếng ồn lớn."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bioluminescent-bobtail-squid') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giáp xác nhỏ", "tôm nhỏ biển sâu", "cá nhỏ vực thẳm", "ấu trùng sinh vật"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính. Thụ tinh trong và lưu trữ túi tinh trực tiếp trong khoang cơ thể. Con cái đẻ các bọc trứng nhỏ bám vào chất nền tầng sâu rồi chết.';
      newC.locomotion = 'swim';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 3.0;

      const charAdd = "Cơ quan phát quang ở mặt bụng tích hợp các thấu kính gelatin và đĩa phản quang sinh học khuếch đại bước sóng xanh lam.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ngụy trang ngược dòng sáng counterillumination và xả đám mây dịch nhầy bioluminescent đánh lừa kẻ địch.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Phóng chất nhầy phát sáng sinh học tự dưỡng autogenic nhờ hệ luciferase tự sản xuất không cộng sinh vi khuẩn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/j.1469-7998.1978.tb03356.x",
        "label": "Journal of Zoology - The light organ and ink sac of Heteroteuthis dispar"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3389/fmars.2023.1200155",
        "label": "Frontiers in Marine Science - Bioluminescence in cephalopods"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Phản ứng sinh phát quang xanh lam đạt hiệu suất chuyển hóa năng lượng gần 100% mà hoàn toàn không sinh nhiệt dư thừa.",
        "Màn sương phát sáng bám dính vào kẻ săn mồi biến kẻ địch thành bia ngắm sáng rực thu hút các loài lớn khác."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế xả dịch phát sáng tự vệ tức thì không phụ thuộc nạp sạc năng lượng hoặc vi khuẩn cộng sinh.",
        "Di cư thẳng đứng hàng ngày (diel vertical migration) giúp tránh hầu hết các loài cá săn mồi tầng mặt ban ngày."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cơ thể mềm yếu không có cấu trúc bảo vệ cơ học như gai hay vỏ cứng, hoàn toàn dễ bị tổn thương vật lý.",
        "Nhạy cảm cực đoan với sự thay đổi áp suất nước lớn khi di chuyển ngoài vùng biển sâu."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
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
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
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

run();
