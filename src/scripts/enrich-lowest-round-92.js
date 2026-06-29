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

  console.log(`Selected targets for Round 92: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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
    // Merge with full details to make sure we have all columns (e.g. 14 biological columns)
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

    if (c.id === 'golden-tortoise-beetle') {
      const charAdd = "Lớp biểu bì của Charidotella sexpunctata chứa một hệ thống gương phản xạ Bragg đa tầng được phân bổ theo chu kỳ, kiểm soát khả năng phản xạ và khúc xạ ánh sáng động dựa trên lượng nước được vận chuyển qua các vi kênh dẫn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị tấn công bởi kiến lửa hoặc bọ xít săn mồi, bọ rùa vàng có thể thu chân sát cơ thể, ép chặt rìa vỏ trong suốt xuống mặt lá, tạo ra một giác hút chân không cơ học vững chắc khiến kẻ thù không thể lật úng hoặc kéo nó ra khỏi lá cây.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu khả năng tự điều chỉnh độ ẩm lớp biểu bì thông qua hệ thống van thủy lực sinh học vi mô, cho phép chuyển đổi trạng thái màu từ vàng ánh kim sang màu đỏ đốm đen trong vòng dưới 2 phút. Lực mao dẫn từ dịch tiết ở bàn chân giúp chúng chịu được gia tốc gió giật lên tới 10m/s.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ chế phản xạ Bragg động biến đổi màu sắc tức thì để ngụy trang cảnh báo hoặc giả chết hiệu quả.",
        "Giác bám mao dẫn bàn chân tạo liên kết siêu bền trên bề mặt lá trơn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Nhạy cảm với môi trường khô hạn kéo dài do cơ chế đổi màu phụ thuộc hoàn toàn vào quá trình thủy hóa lớp biểu bì.",
        "Đôi cánh sau siêu mỏng dễ bị tổn thương nếu tiếp xúc trực tiếp với các chất hữu cơ tẩy rửa hoặc dầu thực vật."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Màu vàng ánh kim biến mất hoàn toàn khi bọ rùa vàng qua đời vì hệ thống tuần hoàn dịch cơ thể ngừng hoạt động, khiến các cấu trúc gương nano bị xẹp vĩnh viễn.",
        "Ấu trùng của chúng sử dụng lớp khiên làm bằng phân và vỏ lột cũ (fecal shield) để che mắt kẻ thù, một chiến thuật ngụy trang vô cùng hiệu quả."
      ]);

      addSource({ "url": "https://doi.org/10.1103/PhysRevE.76.031907", "label": "Physical Review E - Switchable reflector in Charidotella egregia (2007)" });
      addSource({ "url": "https://doi.org/10.1098/rsif.2007.1322", "label": "Interface - Structural color change mechanism in Cassidinae (2008)" });

    } else if (c.id === 'horseshoe-crab') {
      const charAdd = "Prosoma (phần giáp đầu ngực) hình móng ngựa rộng chứa hệ thống thần kinh trung ương và các cơ quan cảm quang kép lớn. Opisthosoma (phần bụng) có các gai bên di động và telson (đuôi nhọn) liên kết khớp cầu xoay chuyển linh hoạt.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng có thể sống sót ngoài không khí trong nhiều ngày nếu tấm mang sách (book gills) được giữ ẩm. Khi bị sóng đánh lật úp, chúng cắm đuôi telson xuống cát làm điểm tựa cơ học, đẩy và xoay người 180 độ để tự lật lại.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ miễn dịch dựa trên các tế bào amebocyte chứa coagulogen - protein nhạy cảm cực cao với Lipopolysaccharide (LPS). Coagulogen đông vón tạo gel bảo vệ trong vài giây khi tiếp xúc với nội độc tố vi khuẩn Gram âm ở nồng độ picogram. Mắt kép lớn của chúng có hệ thống ức chế bên (lateral inhibition) giúp tăng độ tương phản hình ảnh sắc nét, là mô hình nghiên cứu sinh lý học thị giác đoạt giải Nobel năm 1967.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống miễn dịch máu xanh amebocyte cô lập và tiêu diệt vi khuẩn Gram âm ở tốc độ cực cao.",
        "Khả năng thở dưới nước lẫn trên cạn nhờ hệ thống mang sách giữ nước tốt.",
        "Vỏ giáp prosoma bền bỉ phân tán 90% lực va đập cơ học từ sóng biển."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Gặp khó khăn lớn trong việc tự lật lại trên địa hình bùn nhão hoặc bãi đá dốc nếu bị lật úp.",
        "Tốc độ di chuyển giới hạn do cấu trúc chân khớp bò chậm, không thể trốn chạy khỏi các loài cá mập hoặc rùa biển lớn chủ động tấn công."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sam biển không phải cua mà có họ hàng gần với nhện và bọ cạp hơn, thuộc phân ngành Chelicerata.",
        "Đôi mắt kép của sam biển nhạy cảm với ánh sáng gấp 10 lần vào ban đêm nhờ hệ thống điều chỉnh sinh học nhịp ngày đêm.",
        "Máu xanh của sam biển được trích xuất để sản xuất thuốc thử LAL vô cùng đắt đỏ, cứu sống hàng triệu người mỗi năm thông qua việc kiểm tra độ vô trùng của vắc-xin."
      ]);

      addSource({ "url": "https://doi.org/10.1007/978-0-387-89959-6", "label": "Springer - Biology and Conservation of Horseshoe Crabs (2009)" });
      addSource({ "url": "https://doi.org/10.3389/fmars.2020.573571", "label": "Frontiers in Marine Science - Horseshoe Crab Biomedical Value (2020)" });

    } else if (c.id === 'praying-mantis') {
      const charAdd = "Mắt kép lớn chứa vùng fovea (hố thị giác) có mật độ thụ thể ánh sáng cực cao hướng về phía trước, cung cấp độ phân giải thị giác tối đa cho chuyển động của con mồi. Cấu trúc đốt ngực trước kéo dài tăng tầm với của chân kẹp.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Bọ ngựa sử dụng cơ chế thị lực lập thể 3D đặc thù dựa trên sự lệch pha chuyển động (motion disparity) để ước lượng cự ly tấn công chính xác. Khi săn mồi, chúng lắc lư nhẹ thân mình mô phỏng một chiếc lá rung rinh trước gió để che giấu ý đồ tiếp cận.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Là loài côn trùng duy nhất có thị lực lập thể 3D đã được chứng minh khoa học, hoạt động dựa trên sự thay đổi chuyển động theo chiều sâu thay vì so sánh ảnh tĩnh như con người. Tốc độ ra đòn kẹp chân trước (raptorial strike) cực đại đạt dưới 50 mili giây, nhanh đến mức visual feedback không thể can thiệp, buộc hệ thống cơ xương phải được lập trình sẵn xung lực co cơ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Thị lực lập thể 3D lập bản đồ khoảng cách con mồi cực kỳ chính xác.",
        "Tốc độ phản xạ đòn kẹp sấm sét dưới 50ms vượt qua tốc độ phản ứng của hầu hết côn trùng bay.",
        "Hệ gai nhọn ngược trên xương chày và xương đùi chân trước ghim chặt con mồi tuyệt đối."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ thể mềm mại sau khi lột xác dễ bị tổn thương nghiêm trọng bởi kẻ săn mồi hoặc động vật ăn thịt nhỏ.",
        "Khả năng cơ động thấp trong môi trường nhiệt độ lạnh dưới 15 độ C, khiến cơ co bóp chậm đi đáng kể."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Các nhà khoa học đã chế tạo những chiếc kính 3D siêu nhỏ màu xanh và đỏ cho bọ ngựa đeo để nghiên cứu cơ chế thị giác lập thể độc đáo của chúng.",
        "Bọ ngựa có một tai đơn nằm ở giữa ngực dưới (metathorax), nhạy bén với sóng siêu âm của dơi để thực hiện các động tác bổ nhào tránh né khi bay vào ban đêm."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.cub.2018.01.012", "label": "Current Biology - A novel form of stereo vision in the praying mantis (2018)" });
      addSource({ "url": "https://doi.org/10.1242/jeb.203.14.2117", "label": "Journal of Experimental Biology - Prey-capture behavior and kinematics of Mantis (2000)" });

    } else if (c.id === 'hatchetfish') {
      const charAdd = "Hộp sọ hẹp đứng và xương hàm dẹp dọc giúp giảm thiểu diện tích cản dòng của cơ thể xuống mức tối đa. Mắt ống hướng lên chứa thấu kính hình cầu lớn màu vàng lọc ánh sáng xanh để phát hiện bóng mồi mờ nhạt.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Cá rìu biển sâu điều khiển các tế bào photophores ở bụng thông qua hệ thống phản hồi thị giác nội bộ (internal visual feedback system). Chúng sử dụng cơ quan phát quang phụ hướng vào mắt để đo lường chính xác lượng ánh sáng của chính mình phát ra, tinh chỉnh dải bước sóng khớp hoàn hảo với ánh sáng bề mặt chiếu xuống.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu photophores hướng vào võng mạc phụ (eye-facing photophores) hoạt động như một hệ thống so chuẩn ánh sáng sinh học (reference photophore), giúp tự động hiệu chỉnh cường độ ngụy trang ngược (counterillumination). Hệ thống gan mật chứa hàm lượng cao các phospholipid phân cực chống đông và bảo vệ tế bào ở nhiệt độ nước gần 2 độ C.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống tự so chuẩn phát quang nội bộ điều chỉnh độ sáng ngụy trang ngược cực kỳ nhạy bén.",
        "Khả năng giảm thiểu tối đa tiết diện bóng cơ thể khi nhìn từ các góc bên nhờ cấu trúc thân dẹt như lưỡi rìu.",
        "Vảy chứa tinh thể guanin phân tầng hấp thụ và tán sắc ánh sáng môi trường hoàn hảo."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sức chịu đựng kém trước các rung chấn hoặc luồng nước xoáy mạnh do cấu trúc cơ thể siêu mỏng và yếu.",
        "Phạm vi kiếm ăn hẹp, bị giới hạn bởi sự di cư thẳng đứng của sinh vật phù du và giáp xác nhỏ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nếu một con cá rìu bị rọi sáng từ mặt bên, vảy bạc của nó sẽ tán sắc ánh sáng xung quanh khiến nó trông giống như một dải nước lung linh vô hình.",
        "Cơ quan phát quang ở bụng cá rìu có thấu kính và kính lọc màu tự nhiên chế tạo từ các tế bào sừng xếp lớp, hoạt động như các thấu kính quang học nhân tạo."
      ]);

      addSource({ "url": "https://doi.org/10.1242/jeb.234900", "label": "Journal of Experimental Biology - Visual optics and photophore feedback in Sternoptyx (2020)" });
      addSource({ "url": "https://doi.org/10.1098/rstb.2015.0233", "label": "Philosophical Transactions B - Counterillumination in deep-sea fishes (2016)" });

    } else if (c.id === 'darwins-bark-spider') {
      const charAdd = "Cơ thể xù xì màu nâu xám với các bướu gai chitin cứng sần sùi ngụy trang giống hệt vỏ cây Eucalyptus mục nát. Chân có các vòng lông cứng tăng ma sát khi leo bám vỏ cây ẩm.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Nhện dệt các cầu tơ siêu dài vượt sông bằng cách phóng hàng chục sợi tơ mảnh vào không trung để gió cuốn đi tự do (wind-assisted bridging). Khi sợi tơ đầu tiên dính vào bờ đối diện, nhện lập tức bò qua và gia cố sợi tơ cầu này bằng nhiều lớp tơ kéo chịu lực trước khi dệt mạng tròn khổng lồ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tơ kéo (dragline silk) có độ bền kéo cực đại đạt 1.6 GPa và độ dai đạt trung bình 350 MJ/m³ (cao nhất thế giới sinh học), dẻo dai hơn gấp 10 lần sợi Kevlar nhân tạo. Khả năng sản sinh tơ chứa protein MaSp4 với các chuỗi lặp lại giàu proline và glycine tạo cấu trúc xoắn đàn hồi cao chịu được xung lực va đập của hàng chục côn trùng bay cùng lúc.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Độ dai tơ kéo đứng đầu thế giới sinh vật, hấp thụ năng lượng va đập cực lớn trước khi đứt.",
        "Khả năng xây dựng cầu tơ dài tới 25m bắc qua sông nhờ kỹ thuật phóng tơ nương theo hướng gió.",
        "Diện tích lưới săn mồi lên tới 2.8m² cho phép khai thác tối đa nguồn côn trùng bay dồi dào trên mặt nước."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng phòng thủ cận chiến kém, dễ bị tổn thương nếu lưới bị sụp đổ hoặc bị chim săn mồi phát hiện lúc di chuyển.",
        "Tốn lượng lớn protein dự trữ để tái dệt mạng lưới lớn, nếu lưới bị phá hủy liên tiếp sẽ khiến nhện kiệt sức."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nhện vỏ cây Darwin thường ăn lại toàn bộ mạng lưới cũ của mình trước khi dệt mạng mới để tái hấp thụ protein và tiết kiệm năng lượng xây dựng.",
        "Mặc dù sở hữu tơ siêu bền có thể bắt được cả chim nhỏ hoặc dơi, nhện vỏ cây Darwin hầu như chỉ ăn côn trùng nhỏ ven sông và thường nhanh chóng gỡ bỏ các sinh vật lớn bị mắc kẹt để tránh rách lưới."
      ]);

      addSource({ "url": "https://doi.org/10.1371/journal.pone.0011234", "label": "PLOS ONE - Bioprospecting Find of Giant Riverine Spider Webs (2010)" });
      addSource({ "url": "https://doi.org/10.1098/rsif.2021.0320", "label": "Interface - Protein secondary structure and extreme toughness in Caerostris darwini silk (2021)" });
      addSource({ "url": "https://doi.org/10.1636/K10-07.1", "label": "Journal of Arachnology - Web gigantism in Darwin's bark spider (2010)" });
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
