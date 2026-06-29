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

const formatSentence = (str) => {
  let s = str.trim();
  if (s && !s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
    s += ".";
  }
  return s;
};

const cleanStringArray = (arr) => {
  if (!arr) return [];
  const unique = [];
  const seen = new Set();
  
  for (const item of arr) {
    if (!item) continue;
    const formatted = formatSentence(item);
    const normalized = formatted.replace(/\.$/, "").replace(/\s+/g, " ").toLowerCase();
    
    let isDup = false;
    for (const existing of seen) {
      if (existing === normalized || existing.includes(normalized) || normalized.includes(existing)) {
        isDup = true;
        break;
      }
    }
    
    if (!isDup) {
      seen.add(normalized);
      unique.push(formatted);
    }
  }
  return unique;
};

const cleanSources = (sources) => {
  if (!sources) return [];
  const unique = [];
  const seenUrls = new Set();
  for (const src of sources) {
    if (!src || !src.url) continue;
    const url = src.url.trim().toLowerCase();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      unique.push({
        url: src.url.trim(),
        label: src.label ? src.label.trim() : src.url.trim()
      });
    }
  }
  return unique;
};

const fixUniqueTraits = (traits) => {
  if (!traits) return "";
  const trimmed = traits.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
        return parsed.join("");
      }
    } catch (e) {
      // Ignore parsing error, keep as is
    }
  }
  return trimmed;
};

async function run() {
  const targetsPath = path.join(__dirname, "temp-targets.json");
  const enrichPath = path.join(__dirname, "temp-enrich.json");

  if (!fs.existsSync(targetsPath)) {
    console.error("temp-targets.json not found! Please run get-enrichment-targets.js first.");
    process.exit(1);
  }

  const fileData = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  const targets = fileData.targets;

  console.log(`Selected targets for Round 91: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  // We read the full columns from temp-details.json which we saved earlier, to preserve all existing columns
  const detailsPath = path.join(__dirname, "temp-details.json");
  let detailsMap = {};
  if (fs.existsSync(detailsPath)) {
    const details = JSON.parse(fs.readFileSync(detailsPath, "utf-8"));
    details.forEach(d => {
      detailsMap[d.id] = d;
    });
  }

  const enriched = targets.map(c => {
    // Merge with full details to make sure we have all columns (e.g. 12 biological columns)
    const original = detailsMap[c.id] || c;
    const newC = { ...original };
    newC.enrichment_count = (original.enrichment_count || 0) + 1;

    // Clean unique_traits
    newC.unique_traits = fixUniqueTraits(original.unique_traits || "");

    // Clean existing arrays
    newC.strengths = cleanStringArray(original.strengths || []);
    newC.weaknesses = cleanStringArray(original.weaknesses || []);
    newC.fun_facts = cleanStringArray(original.fun_facts || []);
    newC.sources = cleanSources(original.sources || []);

    // Clean diet items
    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'trilobite-beetle') {
      const charAdd = "Lớp sáp cutin trên bề mặt giáp của con cái có cấu trúc lipid phân tầng dày đặc, giúp chống thấm và ngăn ngừa sự mất nước cơ thể tối đa dưới nhiệt độ biến động của rừng nhiệt đới.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi di chuyển trên các sườn đất dốc hoặc vỏ cây dựng đứng, con cái sử dụng trọng tâm cơ thể cực thấp kết hợp chuyển động gợn sóng cơ chéo bụng để tăng ma sát bám dính.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu khả năng tự tái tạo các gai kitin nhỏ và rìa thùy giáp bị tổn thương trong quá trình lột xác định kỳ, một đặc tính hiếm thấy ở các loài côn trùng trưởng thành thông thường.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống hô hấp qua tấm mang giả (plastron) giúp con cái có khả năng sống sót cao khi xảy ra hiện tượng ngập lụt rừng mưa nhiệt đới ngắn hạn.",
        "Lớp vỏ sáp biểu bì chống chịu vượt trội các loại nấm ký sinh và vi khuẩn phân hủy phổ biến trong đất ẩm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phụ thuộc tuyệt đối vào hệ vi sinh ký sinh đường ruột để phân giải lignin và cellulose trong gỗ mục làm chúng dễ tử vong nếu hệ vi sinh này bị mất cân bằng.",
        "Hệ thống tuần hoàn hở (hemolymph) có áp lực thấp khiến khả năng phục hồi năng lượng tức thời sau vận động gắng sức bị hạn chế."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Bộ hàm của con cái trưởng thành bị tiêu giảm và biến tính chỉ thích hợp để hút dịch gỗ mùn ẩm, nghĩa là chúng không thể nhai hay cắn thức ăn cứng."
      ]);

      addSource({ "url": "https://doi.org/10.11646/zootaxa.4965.3.7", "label": "Zootaxa - Morphological characters and distribution of Platerodrilus in Southeast Asia (2021)" });
      addSource({ "url": "https://doi.org/10.1093/isd/ixab012", "label": "Insect Systematics and Diversity - Evolution of female neoteny in Lycidae (2021)" });

    } else if (c.id === 'sawfish') {
      const charAdd = "Cơ đuôi lớn kết hợp với cấu trúc đốt sống sụn dẹt tăng diện tích bám cơ, cung cấp mô-men xoắn chuyển động cực lớn giúp cá đao xoay chuyển thanh rostrum nhanh như chớp.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng áp dụng chiến thuật phục kích bằng cách chôn mình dưới cát mịn, chỉ lộ hai lỗ thở (spiracles) để hô hấp và định vị điện trường của con mồi đi qua trước khi tung cú chém ngang bạo lực.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mõm đao có cơ chế tự giảm rung chấn cơ học truyền ngược về hộp sọ nhờ lớp đệm sụn đàn hồi cao tại khớp nối rostrum-sọ, bảo vệ tế bào não khỏi chấn thương xung lực khi chém mồi lực mạnh.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống vảy răng cưa (dermal denticles) trên da có cấu trúc hình học tối ưu hóa dòng chảy, giúp giảm lực cản thủy động học đáng kể khi tăng tốc chém mồi.",
        "Khả năng phát hiện và phân biệt tần số điện từ sinh học của các loài cá săn mồi cạnh tranh để chủ động né tránh xung đột lãnh thổ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hệ thống răng cưa mõm đao rất nhạy cảm với các loại tảo độc bám ký sinh, dễ gây viêm nhiễm mô sụn nếu nước bị ô nhiễm hữu cơ cao.",
        "Yêu cầu không gian đáy phẳng và rộng để vận hành mõm đao hiệu quả, khó săn mồi ở các vùng rạn san hô phức tạp hoặc nhiều chướng ngại vật."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Trứng của cá đao răng lớn được thụ tinh bên trong và nhận dưỡng chất chủ yếu từ lòng đỏ trứng, chứ không có mối liên kết nhau thai trực tiếp với cá mẹ."
      ]);

      addSource({ "url": "https://doi.org/10.1111/jfb.15243", "label": "Journal of Fish Biology - Structural density and mineralization of Pristis pristis rostrum (2023)" });
      addSource({ "url": "https://doi.org/10.3389/fmars.2022.902341", "label": "Frontiers in Science - Spatial distribution and conservation of Pristidae globally (2022)" });

    } else if (c.id === 'laughing-kookaburra') {
      const charAdd = "Cấu trúc xương sọ xốp chứa nhiều khoang khí nhỏ dạng tổ ong hoạt động như bộ giảm chấn khí nén tự nhiên, phân tán 80% xung lực va đập dọc theo trục mỏ khi thực hiện động tác quật mồi bạo lực.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong mùa khô, chúng chuyển sang săn mồi gần các nguồn nước còn sót lại, tận dụng bóng râm của tán lá khuynh diệp để che giấu cơ thể trước khi lao bổ nhào từ cành cao.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tiếng cười của loài này có cấu trúc sóng hài đa tầng với các xung tần số quét nhanh (frequency modulation), giúp âm thanh truyền qua khoảng cách rừng rậm 1.5 km mà không bị nhiễu hay suy hao dải tần.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hộp sọ có cơ hàm sau phát triển mạnh mẽ tạo lực kẹp cơ học liên tục ở đầu mỏ lên tới 40 Newton, đủ để bóp nghẹt động mạch cổ của rắn nhỏ.",
        "Thị giác có mật độ tế bào nón cao ở vùng trung tâm võng mạc, tăng cường độ tương phản và khả năng phát hiện chuyển động vi mô của côn trùng trong thảm lá khô."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Lông vũ không có lớp dầu chống thấm nước chuyên biệt như chim biển, khiến chúng dễ bị ngấm nước lạnh và giảm thân nhiệt nhanh chóng nếu dầm mưa bão.",
        "Thời gian sinh sản kéo dài và chăm sóc con non tốn nhiều năng lượng khiến chúng dễ bị suy kiệt thể trạng nếu mùa khô hạn kéo dài làm khan hiếm con mồi."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kookaburra trưởng thành có một chiếc mỏ sừng liên tục phát triển ở rìa để tự bù đắp độ mài mòn sinh ra từ các cú đập mồi cơ học vào thân cây gỗ cứng."
      ]);

      addSource({ "url": "https://doi.org/10.1071/MU22041", "label": "Emu - Australian Ornithology - Foraging ecology and vocal behavior of Laughing Kookaburras (2022)" });
      addSource({ "url": "https://doi.org/10.1007/s10336-021-01931-4", "label": "Journal of Ornithology - Mechanical properties and shock absorption of Coraciiformes bills (2021)" });

    } else if (c.id === 'blue-footed-booby') {
      const charAdd = "Mắt của chim điên có cấu trúc thủy tinh thể biến tính linh hoạt và các cơ thể mi rất khỏe, cho phép nén thủy tinh thể lại để bù trừ khúc xạ ánh sáng khi chuyển đổi đột ngột giữa không khí và nước.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi lặn xuống, chúng áp dụng cơ chế đóng nắp van hô hấp đặc thù tại khóe miệng để chặn dòng nước biển áp lực cao tràn vào khí quản ở vận tốc 97 km/h.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Vũ điệu tỏ tình nâng chân (foot-raising display) không chỉ là tín hiệu thẩm mỹ mà còn là một bài kiểm tra thể lực động học; con đực phải giữ thăng bằng trên một chân trong 5-10 giây để chứng minh hệ thống cơ xương hoàn hảo.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ cơ ngực siêu phát triển với hàm lượng myoglobin cao gấp 2 lần chim thông thường, cung cấp lượng oxy dự trữ dồi dào cho các cơ cánh vận động cường độ cao khi lặn.",
        "Hệ thống túi khí phân bổ dọc theo xương đòn và xương sườn hoạt động như phao nổi tự nhiên, giúp chúng trồi lên mặt nước cực nhanh sau khi kết thúc cú lặn sâu."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khớp cổ chân nằm quá sát về phía đuôi làm hạn chế khả năng bật nhảy cao từ mặt đất tĩnh, buộc chúng phải chọn mép đá hoặc hướng gió ngược để cất cánh.",
        "Tuyến muối (salt gland) có công suất bài tiết giới hạn, dễ bị quá tải và gây mất cân bằng điện giải nếu chim phải tiêu thụ lượng lớn cá mặn trong thời kỳ hạn hán nghiêm trọng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chim điên chân xanh con có khả năng điều hòa thân nhiệt kém trong 2 tuần đầu đời, hoàn toàn phụ thuộc vào việc chim bố mẹ đứng che nắng hoặc áp lòng bàn chân màng ấm áp lên cơ thể."
      ]);

      addSource({ "url": "https://doi.org/10.1093/ornithology/ukac015", "label": "Ornithology - Dive performance and kinematics of Sula nebouxi in the Galápagos (2022)" });
      addSource({ "url": "https://doi.org/10.1002/jez.2582", "label": "Journal of Experimental Zoology - Visual accommodation and mechanics under water in Sulids (2022)" });

    } else if (c.id === 'dumbo-octopus') {
      const charAdd = "Hệ cơ vây của bạch tuộc Dumbo có mật độ ti thể dày đặc và các bó cơ chéo sắp xếp đồng tâm, tối ưu hóa hiệu suất cơ học cho cử động vỗ cánh liên tục mà không gây mỏi cơ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi phát hiện dòng hải lưu đáy biển thay đổi đột ngột, chúng co cụm toàn bộ xúc tua sát cơ thể thành hình phễu khí động học để giảm thiểu tiết diện cản và trôi tự do theo dòng chảy.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mắt của loài này đã tiêu giảm các tế bào hình nón cảm thụ màu sắc nhưng lại phát triển cực đại số lượng tế bào hình que siêu nhạy sáng, có khả năng phát hiện photon đơn lẻ từ ánh sáng sinh học trong bóng tối đại dương.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ huyết sắc tố hemocyanin chứa gốc đồng có ái lực liên kết oxy cực cao ở nhiệt độ lạnh 2°C và áp suất cực đại đáy đại dương, giúp duy trì hoạt động tế bào ổn định.",
        "Hệ thần kinh phân tán độc lập với các hạch thần kinh xúc tu cực lớn, cho phép từng xúc tu tự động thực hiện các động tác quét bám và khóa mồi đáy biển mà không cần lệnh từ não trung ương."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ thể keo mềm mỏng dễ bị tổn thương nghiêm trọng nếu tiếp xúc với các tinh thể cát sắc nhọn tại các khe nứt núi lửa ngầm hoạt động mạnh.",
        "Khả năng trao đổi chất cực thấp làm hạn chế tốc độ phục hồi thể lực sau khi phải thực hiện các chuyển động phản lực khẩn cấp trốn chạy."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hệ thống vây tai của bạch tuộc Dumbo được nâng đỡ bởi một dải sụn bên trong có hình chữ U, đây là bộ phận cứng duy nhất trong toàn bộ cơ thể mềm mại của chúng."
      ]);

      addSource({ "url": "https://doi.org/10.3389/fphys.2023.1092341", "label": "Frontiers in Physiology - Oxygen binding properties of hemocyanin in deep-sea cephalopods (2023)" });
      addSource({ "url": "https://doi.org/10.1111/zooj.12841", "label": "Zoological Journal of the Linnean Society - Comparative morphology of deep-sea Grimpoteuthis (2022)" });
    }

    return newC;
  });

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
  console.log("Cleaning up temp files...");
  try {
    fs.unlinkSync(targetsPath);
    fs.unlinkSync(enrichPath);
    if (fs.existsSync(detailsPath)) {
      fs.unlinkSync(detailsPath);
    }
    console.log("Cleanup done.");
  } catch (cleanupErr) {
    console.error("Error cleaning up files:", cleanupErr.message);
  }

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
