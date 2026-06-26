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
  console.log(`Selected targets for Round 52: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'stonefish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "tôm biển", "cua biển", "động vật giáp xác đáy"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài. Con cái đẻ hàng triệu quả trứng bám dính trên các bề mặt đá hoặc san hô ngầm, sau đó con đực rải tinh trùng thụ tinh ngoài để hoàn tất chu kỳ sinh sản.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 400.0;
      newC.weight_avg_g = 1950.0;

      newC.characteristics = appendText(c.characteristics, "Lớp thượng bì sừng hóa dày đặc kết hợp với nhiều gai thịt có khả năng giữ bùn đất và tảo biển bám chặt giúp hòa lẫn hoàn hảo vào môi trường đá ngầm đáy biển.");
      newC.survival_method = appendText(c.survival_method, "Cơ chế nén ép bao cơ độc lực học quanh gai lưng khi bị đè lên ép tuyến độc ở gốc gai giải phóng độc tố dọc theo rãnh sâu truyền dẫn của gai lưng.");
      newC.unique_traits = appendText(c.unique_traits, "Độc tố Stonustoxin (SNTX) tạo thành các lỗ thủng màng tế bào chọn lọc gây tan máu diện rộng, phá hủy tính thấm thành mạch và làm tê liệt trực tiếp các sợi cơ tim.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng ngụy trang vật lý thụ động tối thượng hóa giải mọi phương thức dò tìm hồng ngoại dưới nước.");
      addUniqueItem(newC.strengths, "Lực hút chân không từ cú đớp nuốt chửng con mồi lớn chỉ trong khoảng 15 mili giây.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tốc độ bơi hành trình cực thấp và vụng về do cấu trúc xương vây ngực tiến hóa dạng bò sát đáy đại dương.");
      addUniqueItem(newC.weaknesses, "Khả năng phục hồi bao cơ co thắt sau mỗi lần phóng tuyến nọc độc diễn ra chậm, mất hàng tuần để tái tạo.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nọc độc của cá đá có thể bị phá hủy hoàn toàn bằng cách ngâm nước nóng trên 50 độ C do biến tính nhiệt ở các chuỗi liên kết protein.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2018.06.001",
        label: "Toxicon - Stonustoxin cardiotoxicity and pharmacology"
      });

    } else if (c.id === 'sunda-pangolin') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "mối", "côn trùng nhỏ", "nhộng kiến"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con sống, mỗi lứa đẻ 1 con. Tê tê con sinh ra có lớp vảy mềm sẽ cứng dần sau vài ngày, thường được mẹ cõng trên đuôi hoặc bảo vệ chặt chẽ trong hang.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 750.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 7500.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc vảy sừng keratin xếp tầng theo lớp ngói lợp, chiếm tới 20% trọng lượng cơ thể, bảo vệ tối ưu trước móng vuốt dã thú.");
      newC.survival_method = appendText(c.survival_method, "Cuộn tròn cơ thể tạo thành một khối cầu bất khả xâm phạm và dùng cơ đuôi cực khỏe dựng ngược cạnh vảy sừng sắc bén cọ xát tạo lực cắt vật lý.");
      newC.unique_traits = appendText(c.unique_traits, "Cấu trúc lưỡi dài dẹt liên kết trực tiếp sâu xuống vùng xương ức ngực và dạ dày đặc biệt chứa các viên sỏi nhỏ hỗ trợ nghiền nát côn trùng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Giáp vảy sừng keratin siêu cứng phân bổ đều chịu lực cắn xé của các thú ăn thịt họ mèo lớn.");
      addUniqueItem(newC.strengths, "Tuyến dịch hậu môn phát triển phóng dịch hôi xua đuổi kẻ địch trong phạm vi gần.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thị lực suy thoái nghiêm trọng, phụ thuộc hoàn toàn vào khứu giác để sinh hoạt.");
      addUniqueItem(newC.weaknesses, "Không có vũ khí tấn công chủ động răng hàm hay tự vệ trực diện tầm xa.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tuyến sữa của tê tê cái nằm dưới nách chứ không nằm ở ngực hay bụng như các loài thú thông thường.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/jzo.12814",
        label: "Journal of Zoology - Anatomical adaptations of the Sunda pangolin tongue and neck"
      });

    } else if (c.id === 'superb-lyrebird') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng", "giun đất", "nhện rừng", "động vật không xương sống", "ấu trùng sâu bọ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Mỗi năm đẻ duy nhất 1 trứng trong tổ hình vòm lớn xây sát mặt đất. Thời gian ấp trứng kéo dài khoảng 50 ngày do chim cái độc lập nuôi dưỡng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 800.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 1050.0;

      newC.characteristics = appendText(c.characteristics, "Cơ thanh quản syrinx (minh quản) đặc biệt phát triển vượt bậc với 3 cặp cơ điều khiển độc lập cho phép đồng thời điều phối hai dải âm tần phát âm riêng biệt.");
      newC.survival_method = appendText(c.survival_method, "Giả giọng các tín hiệu âm thanh hoảng loạn hoặc tiếng kêu báo động của bầy đàn săn mồi lớn để gây nhiễu loạn thông tin định vị hướng của thú săn mồi mặt đất.");
      newC.unique_traits = appendText(c.unique_traits, "Bộ lông đuôi chim trống gồm 16 sợi lông vũ biến đổi tiến hóa cực kỳ tinh xảo, phối hợp nhịp nhàng giữa chuyển động cơ học đuôi và nhịp điệu nhại âm phức tạp.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng nhại âm tần cơ học phong phú gây nhiễu loạn thông tin định vị của dã thú săn mồi.");
      addUniqueItem(newC.strengths, "Đôi chân to khỏe cấu trúc móng vuốt lớn chịu lực cào xới đất tìm côn trùng liên tục.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Xương cánh tiến hóa thoái hóa làm giảm lực nâng khí động học, giới hạn khả năng bay xa tránh kẻ thù.");
      addUniqueItem(newC.weaknesses, "Tổ xây trên mặt đất cực kỳ dễ bị các loài ăn thịt ngoại lai như mèo hoang, cáo xâm nhập phá hoại.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Có thể nhại lại tiếng cưa máy, còi báo động cháy rừng, tiếng sập màn trập máy ảnh cơ cực kỳ chân thực.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.cub.2021.01.079",
        label: "Current Biology - Vocal mimicry of predator mobs by male superb lyrebirds"
      });

    } else if (c.id === 'swordfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nục", "cá thu", "mực ống", "cá ngừ nhỏ", "cá trích"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 9;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài ven biển. Con cái đẻ hàng triệu trứng trôi nổi tự do trong nước ấm. Ấu trùng mới nở dài 4mm có răng và vảy nhưng sẽ biến đổi hoàn toàn khi lớn.';
      newC.locomotion = 'swim';
      newC.speed_max = 97.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 4550.0;
      newC.weight_avg_g = 275000.0;

      newC.characteristics = appendText(c.characteristics, "Thân hình thuôn dài hoàn hảo triệt tiêu vảy giảm thiểu tối đa ma sát kéo thủy động lực học khi di chuyển ở vận tốc nước rút.");
      newC.survival_method = appendText(c.survival_method, "Lao vút vào trung tâm bầy cá với gia tốc lớn rồi dùng thanh kiếm xương dẹt chém liên hồi theo chiều ngang để làm bất động con mồi trước khi nuốt chửng.");
      newC.unique_traits = appendText(c.unique_traits, "Cơ quan sưởi ấm chuyên biệt chuyển hóa năng lượng hoạt động cơ mắt giữ nhiệt độ não và võng mạc cao hơn môi trường nước lạnh sâu tới 15 độ C.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Gia tốc cực đại rượt đuổi con mồi ở cự ly ngắn vượt trội bậc nhất đại dương mở.");
      addUniqueItem(newC.strengths, "Thành phần xương kiếm được canxi hóa dày đặc bền uốn tạo xung lực đánh đập mạnh không gãy.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không thể tự lưu thông nước qua mang mà buộc phải bơi liên tục (ram ventilation) để duy trì hô hấp oxy.");
      addUniqueItem(newC.weaknesses, "Khó thực hiện các cú bẻ lái xoay góc hẹp đột ngột ở vận tốc nước rút cực lớn.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Hệ thống sưởi ấm võng mạc độc đáo giúp chúng tăng độ phân giải hình ảnh lên gấp 10 lần trong vùng biển tối lạnh.");

      newC.sources = [
        ...(c.sources || [])
      ];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.01344",
        label: "JEB - Hydrodynamics of the swordfish rostrum and oil gland secretion"
      });

    } else if (c.id === 'sydney-funnel-web-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["côn trùng lớn", "cuốn chiếu", "nhện khác", "ếch nhỏ", "thằn lằn nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ trứng vào bọc tơ bảo vệ chứa khoảng 100 trứng trong hang phễu ẩm ướt. Con đực lang thang tìm bạn tình trong đêm mưa và thường chết sau khi giao phối.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 10.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 3.0;

      newC.characteristics = appendText(c.characteristics, "Đôi nanh chelicerae song song chĩa thẳng đứng bổ xuống tạo lực đâm cơ học mạnh mẽ vượt trội so với răng nanh bắt chéo thông thường ở các loài nhện khác.");
      newC.survival_method = appendText(c.survival_method, "Mạng tơ xúc giác (trip-lines) tỏa rộng từ miệng hang truyền xung rung động cơ học báo hiệu vị trí con mồi đi qua cực kỳ nhạy.");
      newC.unique_traits = appendText(c.unique_traits, "Độc tố Delta-atracotoxin trong nọc nhện liên kết bền vững và làm chậm quá trình bất hoạt của kênh natri nhạy cảm điện thế trong tế bào thần kinh linh trưởng.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Độ cứng răng nanh chelicerae siêu việt đâm xuyên móng tay người hoặc giày da mỏng dễ dàng.");
      addUniqueItem(newC.strengths, "Khả năng giả chết phục hồi sinh lực dưới nước nhờ lớp lông nhầy giữ bóng khí lâu dài.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tốc độ thoát hơi nước qua lớp biểu bì bụng cực nhanh khiến chúng dễ bị chết khô khi độ ẩm giảm dưới 50%.");
      addUniqueItem(newC.weaknesses, "Khi đi rời hang, giác quan định vị địa hình bị suy giảm, dễ bị thiên địch săn bắt.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Nọc độc nhện đực độc gấp 6 lần nhện cái và đặc biệt chỉ nguy hiểm chí mạng với thú linh trưởng và người.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1073/pnas.2007323117",
        label: "PNAS - Australian funnel-web spiders evolved human-lethal delta-hexatoxins for defense"
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
  fs.unlinkSync(enrichPath);
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
