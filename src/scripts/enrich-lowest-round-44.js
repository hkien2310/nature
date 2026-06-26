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
  console.log(`Selected targets for Round 44: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'pacific-hagfish') {
      newC.characteristics = appendText(c.characteristics, "Thiết kế cơ thể lỏng lẻo với khoang xoang dưới da chứa dịch giúp da trượt tự do tránh tổn thương nội tạng khi bị cá mập cắn.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Hệ thống cơ thể lỏng lẻo độc đáo cho phép da chuyển động trượt tự do để phân tán xung lực cắn đớp từ hàm răng cá mập.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tiêu tốn lượng năng lượng lớn và mất từ 3-4 tuần để tái tích lũy đầy đủ lượng dịch protein trong các tuyến nhầy sau khi xả thải.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Lươn nhầy Thái Bình Dương sống sót qua các cú cắn đớp mạnh không phải nhờ da chống đâm thủng mà nhờ cơ chế da baggy lỏng lẻo trượt tự do khiến răng kẻ săn mồi trượt qua.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsif.2017.0765",
        label: "Flaccid skin protects hagfishes from shark bites"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1146/annurev-biochem-060614-034048",
        label: "Physiology, biomechanics, and biomimetics of hagfish slime"
      });

    } else if (c.id === 'panther-chameleon') {
      newC.characteristics = appendText(c.characteristics, "Cấu trúc dây thần kinh thị giác dài và uốn khúc có độ chùng tự nhiên để nhãn cầu xoay chuyển 360 độ mà không làm căng căng đứt dây thần kinh truyền dẫn.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế phóng lưỡi đàn hồi từ bao sợi collagen hoạt động độc lập với nhiệt độ môi trường, giữ nguyên gia tốc khủng khiếp ngay cả khi trời lạnh.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Tuyến nước bọt đầu lưỡi sản sinh chất nhầy nhớt đòi hỏi cung cấp nước liên tục, dễ bị khô và trượt mồi nếu thiếu nước ẩm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Dây thần kinh thị giác của tắc kè hoa được cấu tạo dạng lò xo chùng để nhãn cầu xoay chuyển 360 độ tự do mà không gây tổn hại đến võng mạc.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1098/rsif.2016.0371",
        label: "Elastic recoil kinematics of chameleon tongue strike"
      });

    } else if (c.id === 'paradise-flying-snake') {
      newC.characteristics = appendText(c.characteristics, "Mặt phẳng cơ thể hình bán nguyệt lõm sâu (ventral concavity) khi lướt đóng vai trò tạo lực nâng khí động học tối ưu như một airfoil cánh máy bay.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Chuyển động uốn lượn uốn sóng cơ thể liên tục (aerial undulation) giúp tạo thế cân bằng tự nhiên hồi chuyển chống lại các mô-men lật xoay.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Cơ cấu xương sườn mở rộng tối đa làm giảm khả năng siết cơ truyền thống, khiến chúng bất lợi khi đụng độ con mồi lớn khỏe.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khi lướt trong không khí, rắn bay thiên đường uốn lượn cơ thể không phải để bay nhanh hơn mà là để duy trì sự thăng bằng hồi chuyển giúp cơ thể không bị lộn ngược.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1242/jeb.090902",
        label: "Aerodynamics of the flying snake Chrysopelea paradisi"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/s41567-020-0935-4",
        label: "Undulation enables rotational stability in gliding snakes"
      });

    } else if (c.id === 'payara') {
      newC.characteristics = appendText(c.characteristics, "Khớp nối sọ-hàm có tính động học cao (highly kinetic skull) phối hợp với cơ cơ thể trục dọc (axial musculature) dồn lực đâm trực diện xuyên thủng vỏ con mồi.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Phương thức tấn công đâm impaling cơ học trực diện thay vì suction feeding giúp chúng chế ngự các loài cá có giáp dày hoặc gai nhọn.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Không có khả năng tạo lực hút mồi lớn từ xa do răng nanh quá dài cản trở luồng nước hút tự nhiên.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Khác với đa số cá săn mồi dùng cơ chế hút nước để nuốt chửng con mồi, Payara sử dụng hộp sọ động học để đâm trực diện cặp nanh kiếm dài ghim chặt con mồi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1643/0045-8511(2000)000[0045:SOTNFS]2.0.CO;2",
        label: "Systematics of the Neotropical fish subfamily Cynodontinae"
      });

    } else if (c.id === 'peacock-mantis-shrimp') {
      newC.characteristics = appendText(c.characteristics, "Thiết kế lớp dactyl club chứa mật độ hạt nano hydroxyapatite vô định hình cực cao để triệt tiêu và chuyển hóa năng lượng chấn động phản lực.");
      
      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế chủ động xoay nhãn cầu liên tục (dynamic polarization vision) giúp tối đa hóa độ tương phản quang học của môi trường xung quanh.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nhãn cầu nhô cao dễ bị tấn công vật lý gây mù lòa tạm thời hoặc vĩnh viễn trước các con mồi có ngạnh nhọn.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Tôm bọ ngựa peacock có thể chủ động xoay tròn đôi mắt để căn chỉnh các tế bào thụ cảm phân cực thẳng hàng với hướng ánh sáng giúp nhìn thấu ngụy trang của con mồi.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1126/science.1218512",
        label: "The Stomatopod Dactyl Club: A Formidable Damage-Tolerant Biological Hammer"
      });
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/ncomms11210",
        label: "Dynamic polarization vision in mantis shrimps"
      });
    }

    return newC;
  });

  // Write file
  const tempFilePath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(tempFilePath, JSON.stringify(enriched, null, 2));
  console.log(`Successfully generated temp-enrich.json at ${tempFilePath}`);

  console.log("Calling update-enrichment.js script to persist the data... ");
  try {
    const updateScriptPath = path.join(__dirname, "update-enrichment.js");
    const output = execSync(`node ${updateScriptPath} ${tempFilePath}`, { encoding: "utf-8" });
    console.log(output);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout);
    if (err.stderr) console.error("Stderr:", err.stderr);
    process.exit(1);
  }

  // Clean up
  console.log("Cleaning up temp-enrich.json...");
  if (fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  targets.forEach((t, i) => {
    console.log(`${i + 1} | ${t.name} | ${t.id} | ${t.class} | ${t.enrichment_count + 1}`);
  });
  console.log("==============================================================================");
}

run();
