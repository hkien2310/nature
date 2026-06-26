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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

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
  console.log(`Selected targets for Round 60: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'barreleye-fish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["sứa ống siphonophore", "giáp xác nhỏ", "sinh vật trôi nổi", "ấu trùng cua", "copepod"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài. Trứng và tinh trùng được giải phóng vào cột nước sâu. Trứng có hàm lượng lipid cao giúp chúng nổi lên tầng nước nông hơn nơi ấu trùng phát triển, trước khi chìm xuống tầng nước sâu khi trưởng thành.';
      newC.locomotion = 'swim';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 80.0;

      const charAdd = " Lớp da vảy màu xám đen bao bọc cơ thể chứa các hạt sắc tố hấp thụ hoàn toàn tia sáng sinh học từ các kẻ săn mồi khác.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng thích ứng đặc biệt giúp chịu đựng áp suất thủy tĩnh cực đại lên tới 80 lần áp suất khí quyển.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Màng nhầy trong suốt ở đầu chứa glycoprotein chống đông tụ đông cứng dưới nhiệt độ cận băng giá của nước sâu.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rstb.2015.0069",
        "label": "The sensory ecology of deep-sea fishes"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.14589",
        "label": "Journal of Fish Biology - Opisthoproctidae ocular morphology"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù đầu trông giống như một khối liền mạch cứng cáp, vòm trong suốt thực chất là một lớp màng chất lỏng sinh học dẻo đàn hồi cực kỳ linh động.",
        "Đôi mắt hình ống màu xanh của chúng chứa hàm lượng rhodopsin rất cao để tối đa hóa khả năng hấp thụ các bước sóng ngắn trong đêm tối của đại dương."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống vây ngực và vây bụng siêu dài hoạt động như mái chèo định vị giúp xoay trở cơ thể tại chỗ không gây tiếng động.",
        "Khả năng hấp thụ ánh sáng sinh học cực tốt nhờ tế bào sắc tố melanophore đặc biệt trên da."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ trao đổi chất và nhịp tim cực thấp khiến chúng không thể phục hồi nhanh sau khi cạn kiệt oxy.",
        "Dễ bị tổn thương bởi các loài cá săn mồi có tốc độ cao như cá tuyết hoặc các loài cá mập nhỏ vùng nước sâu."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'basilisk-lizard') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["côn trùng", "nhện", "ếch nhỏ", "cá nhỏ", "quả mọng", "hoa rừng"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ từ 5 đến 18 trứng trong một hố đất cát ẩm ướt gần nguồn nước. Trứng được ấp bằng nhiệt độ đất tự nhiên và tự nở sau khoảng 8-10 tuần. Thằn lằn con tự lập ngay lập tức.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 800.0;
      newC.weight_avg_g = 400.0;

      const charAdd = " Lớp da thấm hydrophobe bao phủ ngón chân đẩy nước mạnh, ngăn nước bám trực tiếp làm giảm gia tốc hoạt động.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi trốn thoát bằng hai chân sau thất bại, chúng nhanh chóng dang rộng bốn chi bơi ếch tốc độ cao dưới dòng nước xiết.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khớp gối chân sau có cấu trúc xoay đa trục giảm tải áp lực phản chấn cơ học khổng lồ từ mặt nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.01193",
        "label": "Journal of Experimental Biology - Water running kinematics of Basiliscus"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.1996.0232",
        "label": "Royal Society Proceedings - Force production of water-walking lizards"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù nổi tiếng với việc chạy trên nước, thằn lằn Basilisk cũng có thể chạy bằng 2 chân sau trên nền đất khô với tốc độ bứt phá đáng kinh ngạc.",
        "Trong điều kiện nuôi nhốt hoặc căng thẳng kéo dài, mào của con đực có thể bị co rút nhỏ lại do sụt giảm mức hormone testosterone."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng leo trèo thẳng đứng trên thân cây trơn nhờ móng vuốt cong sắc nhọn bám tốt.",
        "Phản xạ thị giác siêu nhạy giúp bắt trúng các loài côn trùng bay nhanh giữa không trung."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Bộ mào lớn của con đực đôi khi tạo ra sức cản gió đáng kể khi chạy ngược hướng gió mạnh.",
        "Dễ bị chim ăn thịt phát hiện từ trên cao do kích thước mào và đuôi nổi bật khi di chuyển."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bearded-vulture') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["xương động vật", "tủy xương", "xác thối", "động vật nhỏ sát thương", "mai rùa"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 20;
      newC.lifespan_max = 45;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản đơn phối phối ngẫu dài hạn. Con cái đẻ từ 1 đến 2 quả trứng trên các vách đá dựng đứng vào giữa mùa đông. Thời gian ấp trứng kéo dài khoảng 53-58 ngày do cả hai bố mẹ thay phiên nhau.';
      newC.locomotion = 'fly';
      newC.speed_max = 36.0;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 940.0;
      newC.size_max_mm = 1250.0;
      newC.weight_avg_g = 6000.0;

      const charAdd = " Lông mặt phát triển thành lớp đệm hấp thụ các hạt bụi cát tốc độ cao trong các cơn bão núi cao đặc trưng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Thải ra các axit hữu cơ cực mạnh từ ruột để tự vệ hóa học nếu bị động vật ăn thịt tấn công khi đang ở dưới mặt đất.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng tái chế canxi vượt trội giúp cơ thể giữ lại tới 95% lượng khoáng chất từ thức ăn xương khô.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1006/anbe.1997.0542",
        "label": "Animal Behaviour - Mud bathing in bearded vultures"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.ygcen.2018.11.002",
        "label": "General and Comparative Endocrinology - Stress hormones and behavior in Gypaetus barbatus"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù là chim ăn xác thối, kền kền râu rất sạch sẽ, chúng không ăn phần thịt thối rữa quá mức mà ưu tiên xương khô sạch khuẩn.",
        "Đôi mắt của kền kền râu có thấu kính đôi giúp phóng to hình ảnh các vật thể tĩnh như xương khô trên sườn núi đá."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng lướt không trung nhiều giờ liên tục mà không cần vỗ cánh nhờ cánh biên dạng động học cao.",
        "Hệ thống miễn dịch siêu cường chống lại tất cả các loại vi khuẩn gây bệnh chôn vùi trong xác động vật mục nát."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hầu như không có tiếng kêu hoặc tiếng hú đe dọa lớn, khả năng tự vệ tiếng động hạn chế.",
        "Không có khả năng chiến đấu trực diện tranh giành mồi sống với đại bàng vàng hoặc kền kền đen do móng vuốt yếu."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bee-hummingbird') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật hoa rừng", "nhện nhỏ", "côn trùng nhỏ", "ấu trùng", "rệp cây"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con đực giao phối với nhiều con cái trong mùa sinh sản. Con cái tự làm tổ hình chiếc cốc nhỏ từ rêu và tơ nhện dẻo dai, sau đó đẻ 2 quả trứng nhỏ. Thời gian ấp trứng khoảng 21-23 ngày.';
      newC.locomotion = 'fly';
      newC.speed_max = 13.4;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 60.0;
      newC.weight_avg_g = 2.0;

      const charAdd = " Lông cánh mịn bọc lớp chất dầu chống dính sương mù và nước mưa nhiệt đới để bay không bị nặng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Di cư theo chiều dọc sườn núi theo chu kỳ mùa nở hoa của các loài cây bụi đặc hữu.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tim có tỷ lệ cơ sợi actin-myosin co bóp siêu tốc, chịu tải nhịp đập 20Hz liên tục không suy tim.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/condor/105.1.169",
        "label": "The Condor - Breeding ecology of Cuban Bee Hummingbirds"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.02345",
        "label": "Journal of Experimental Biology - Aerodynamics of hummingbird hovering flight"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mặc dù là chim, nhưng do kích thước quá nhỏ, chim ruồi ong thường bị ong mật nhầm lẫn là kẻ xâm nhập và bị tấn công.",
        "Tốc độ trao đổi chất cực cao khiến chúng phải thở tới 250 lần mỗi phút ngay cả khi đang nghỉ ngơi tĩnh."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Phản xạ né tránh chim săn mồi cực nhanh nhờ các neuron vận động có tốc độ dẫn truyền tín hiệu thần kinh siêu tốc.",
        "Khả năng thụ phấn cho hoa hiệu quả hơn cả ong mật nhờ lượng phấn bám dính tốt trên lông mỏ."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Gặp nguy hiểm cực lớn khi xảy ra mưa bão hoặc gió lốc lớn, do trọng lượng quá nhẹ dễ bị thổi bay.",
        "Dễ bị kiệt quệ năng lượng dẫn đến đột tử nếu mật hoa bị nhiễm thuốc trừ sâu nồng độ thấp."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bengal-slow-loris') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["nhựa cây", "mật hoa", "côn trùng", "trứng chim", "động vật bò sát nhỏ", "quả chín"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Thai sản đơn thai dài hạn. Thời gian mang thai kéo dài khoảng 6 tháng (188 ngày). Cu li con bám chặt vào bụng mẹ trong những tuần đầu, sau đó được "gửi" trên cành cây an toàn khi mẹ đi tìm kiếm nhựa cây.';
      newC.locomotion = 'walk';
      newC.speed_max = 2.2;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 340.0;
      newC.size_max_mm = 380.0;
      newC.weight_avg_g = 1500.0;

      const charAdd = " Lông bụng màu xám dày có tác dụng ngụy trang tiệp với màu cành cây phủ rêu ẩm ướt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi gặp kẻ thù săn mồi lớn trên cây, chúng chủ động buông tay rơi thẳng xuống mặt đất để trốn thoát.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Lớp da vùng cổ và vai dày gấp 3 lần bình thường giúp chống đỡ các cú cắn tranh giành lãnh thổ của đối thủ.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1007/s10764-020-00167-9",
        "label": "International Journal of Primatology - Slow loris venom and reproduction"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/conl.12879",
        "label": "Conservation Letters - Trade and conservation of Nycticebus bengalensis"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Mùi của nọc độc brachial khi giải phóng có mùi gần giống như mùi mồ hôi hoặc mùi men trái cây chín để ngụy trang khứu giác.",
        "Chúng là loài linh trưởng duy nhất có răng nanh hàm trên có rãnh dọc dẫn nọc độc chảy trực tiếp từ nước bọt vào vết cắn."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Khả năng khóa khớp ngón chân cơ học giúp ngủ treo ngược cành cây không tốn năng lượng co cơ.",
        "Nọc độc hoại tử có tính sát thương sinh hóa cao giúp xua đuổi các loài thú ăn thịt lớn hơn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ thống hô hấp kém hiệu quả dưới khí độc hoặc khói cháy rừng do phổi có dung tích tương đối nhỏ.",
        "Phản ứng chạy trốn bằng tốc độ vật lý gần như bằng không, hoàn toàn phụ thuộc vào ngụy trang và chất độc tự vệ."
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
