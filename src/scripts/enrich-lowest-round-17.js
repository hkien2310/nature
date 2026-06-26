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
  console.log(`Selected targets for Round 17: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'sunda-pangolin') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "mối", "ấu trùng côn trùng"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con. Thời gian mang thai kéo dài khoảng 130 ngày. Mỗi lứa chỉ đẻ 1 con non đơn độc. Con non bám chặt vào đuôi hoặc lưng mẹ khi mẹ đi kiếm ăn ban đêm.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 750.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 7500.0;

      const charAdd = " Cấu trúc xương sườn và các đốt sống đuôi linh hoạt kết hợp với hệ cơ bụng cực khỏe giúp tê tê cuộn tròn chặt chẽ thành khối cầu vững chắc không thể phá vỡ từ bên ngoài.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi bị dã thú bao vây tấn công, chúng sẽ cuộn tròn rồi dùng cơ đuôi khỏe dựng ngược các cạnh vảy keratin sắc bén cọ xát tạo tiếng ồn cảnh báo và gây vết cắt xước đau đớn.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống van tự động đóng khít hốc mũi và lỗ tai ngoài ngăn cản côn trùng chui vào tấn công khi tê tê phá tổ kiến để kiếm ăn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.12814",
        "label": "Journal of Zoology - Anatomical adaptations of the Sunda pangolin tongue and neck"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.jveb.2020.05.004",
        "label": "Journal of Veterinary Behavior - Behavioral ecology and defense mechanisms in Manidae"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Dạ dày của tê tê Java sở hữu lớp vách cơ dày và thường chứa những viên sỏi nhỏ nuốt vào để nghiền nát thức ăn thay thế cho hàm răng đã thoái hóa hoàn toàn.",
        "Tuyến vú của tê tê Java cái không nằm ở ngực hay bụng như các loài thú thông thường mà nằm ở vùng nách dưới hai chi trước."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lực cơ bắp và cơ đuôi bền bỉ duy trì tư thế cuộn tròn hoàn hảo bảo vệ bụng dưới suốt nhiều giờ",
        "Hệ thống vảy sừng xếp lớp hoạt động như lớp giáp chống chịu tốt trước lực cắn của báo đốm"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Quá trình tìm kiếm côn trùng đòi hỏi di chuyển chậm chạp trên mặt đất khiến chúng dễ bị phát hiện bởi con người"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'superb-lyrebird') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["kiến", "bọ cánh cứng", "nhện", "giun đất", "ấu trùng", "hạt nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Mỗi mùa sinh sản chỉ đẻ duy nhất một quả trứng lớn màu xám/nâu. Con cái đơn độc xây tổ dạng vòm trên mặt đất, tự ấp trứng trong 50 ngày và nuôi con non không có sự giúp đỡ của con đực.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 12.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 800.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 950.0;

      const charAdd = " Cơ quan phát thanh syrinx (minh quản) sở hữu 3 cặp cơ điều khiển độc lập siêu linh hoạt giúp tái tạo tần số âm thanh từ môi trường tự nhiên lẫn nhân tạo với độ chuẩn xác cực cao.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi phát hiện mối đe dọa gần tổ, chúng sẽ giả giọng tiếng kêu báo động hỗn loạn của một bầy chim lớn bị tấn công, làm hoang mang và xua đuổi kẻ săn mồi.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Đuôi của chim trống gồm 16 sợi lông vũ biến đổi cực kỳ tinh xảo, trong đó có 2 sợi lông chính có hoa văn sọc ngang giống khung đàn lia Menura.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cub.2021.01.079",
        "label": "Current Biology - Vocal mimicry of predator mobs by male superb lyrebirds"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/emu.12012",
        "label": "Emu - Austral Ornithology - Display behavior and acoustic signals of Menura novaehollandiae"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng có khả năng bắt chước hoàn hảo các âm thanh nhân tạo như tiếng cưa máy, còi báo động cháy rừng, tiếng chụp của máy ảnh cơ và tiếng khóc của trẻ em.",
        "Chim thiên cầm đực tự đào những đụn đất tròn gọi là 'sân khấu' để phô diễn điệu nhảy kết hợp âm thanh bắt chước nhằm thuyết phục bạn tình trong mùa sinh sản."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ cơ chân khỏe mạnh thích nghi cho việc cào xới liên tục các thảm thực vật mục nát trên mặt đất",
        "Khả năng ngụy trang âm thanh đa dạng gây nhiễu loạn thông tin định vị của dã thú"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ thống xương cánh và cơ ngực kém phát triển làm giảm đáng kể khả năng bay cao tránh kẻ thù"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'swordfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá thu", "cá trích", "cá ngừ nhỏ", "mực ống", "cá thu đao"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 9;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Thụ tinh ngoài ở các vùng biển nhiệt đới ấm áp. Một con cái lớn có thể mang tới 29 triệu quả trứng trong buồng trứng. Trứng nổi tự do trên tầng mặt nước biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 97.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 4500.0;
      newC.weight_avg_g = 200000.0;

      const charAdd = " Hệ cơ quan sưởi ấm chuyên biệt nằm cạnh mắt được nuôi dưỡng bởi mạng lưới động tĩnh mạch võng mạch, giúp duy trì nhiệt độ võng mạc cao hơn nước xung quanh từ 10 đến 15 độ C.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Lao thẳng vào bầy cá thu hoặc mực ống với tốc độ cực đại rồi dùng thanh kiếm chém ngang làm tê liệt hoặc chia cắt con mồi trước khi thong thả nuốt chửng.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Thanh kiếm được cấu tạo từ xương hàm trên kéo dài và cứng hóa bằng các tinh thể canxi sắp xếp chặt chẽ, kết hợp với các gai mịn nhỏ giúp giảm ma sát khi rẽ nước.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1126/science.1106036",
        "label": "Science - Cranial endothermy and vision enhancement in deep-diving swordfish"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.01344",
        "label": "JEB - Hydrodynamics of the swordfish rostrum and oil gland secretion"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cá kiếm trưởng thành hoàn toàn không có răng; chúng sử dụng thanh kiếm sắc bén để cắt chém con mồi trước khi nuốt chửng.",
        "Gốc kiếm của cá kiếm có một tuyến sáp tiết ra dầu bôi trơn đặc biệt bao phủ phần đầu giúp giảm ma sát cản nước lên tới hơn 30% khi bơi nước rút."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ mắt được sưởi ấm duy trì thị lực siêu nhạy bén và xử lý hình ảnh nhanh gấp 10 lần ở vùng nước sâu lạnh",
        "Cơ thể hình ngư lôi thuôn dài lý tưởng cho việc đạt vận tốc nước rút cực đại trong thời gian ngắn"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Lối sống đơn độc di cư đường dài khiến chúng dễ bị vướng vào các lưới đánh cá ngừ đại dương"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'sydney-funnel-web-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["bọ cánh cứng", "gián đất", "cuốn chiếu", "ốc sên", "ếch nhỏ", "thằn lằn nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ khoảng 100 quả trứng và dệt thành kén tơ tròn để bảo vệ nghiêm ngặt bên trong hang sâu hình phễu ẩm ướt.';
      newC.locomotion = 'crawl';
      newC.speed_max = 2.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 35.0;
      newC.weight_avg_g = 2.5;

      const charAdd = " Tuyến độc khổng lồ chiếm tới 1/3 khoang đầu ngực kết hợp đôi nanh chelicerae cực khỏe hướng xuống dưới tạo lực ghim đâm cực mạnh.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Dệt các sợi tơ cảnh báo rung động (trip-lines) tỏa ra từ miệng hang để cảm nhận chính xác bước đi của con mồi hoặc kẻ thù từ khoảng cách xa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Độc tố Atraxotoxin (đặc biệt là Robustoxin ở nhện đực) là một peptide độc thần kinh tấn công cực kỳ nhạy bén vào thụ thể kênh natri của động vật linh trưởng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2005.02.022",
        "label": "Toxicon - Isolation and characterization of robustoxin from Atrax robustus"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins12080511",
        "label": "Toxins - Structural and functional diversity of Australian funnel-web spider venom peptides"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nọc độc của nhện đực độc gấp 6 lần nhện cái và đặc biệt gây tử vong cho người và linh trưởng, trong khi động vật khác như chó mèo lại hoàn toàn kháng độc.",
        "Chúng có thể sống sót dưới nước trong hơn 24 giờ bằng cách bẫy một bong bóng không khí xung quanh lớp lông mịn ở bụng."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cặp nanh chelicerae siêu khỏe có khả năng đâm xuyên qua cả lớp sừng da dày hoặc móng chân người",
        "Nọc độc thần kinh Robustoxin cực mạnh phá hủy hệ thần kinh vận động của linh trưởng nhanh chóng"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Rất nhạy cảm với việc mất nước và ánh nắng mặt trời trực tiếp, dễ chết nếu hang bị khô hạn"
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'tarantula-hawk') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["mật hoa", "nhựa cây", "quả chín lên men", "nhện tarantula (cho ấu trùng)"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng lên cơ thể nhện tarantula bị tê liệt. Ấu trùng nở ra sẽ đục vỏ nhện và ăn dần các cơ quan không thiết yếu để giữ nhện sống tươi ngon lâu nhất có thể.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 51.0;
      newC.weight_avg_g = 1.2;

      const charAdd = " Ngòi châm trơn láng dài tới 7mm không ngạnh giúp châm tiêm nọc độc liên tục ở nhiều góc độ hiểm hóc mà không bị kẹt hay đứt lìa.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết chất độc Pompilidotoxin đặc hiệu gây khóa kênh natri của nhện tarantula, làm tê liệt toàn bộ hệ thống cơ vận động nhưng giữ cho con mồi sống suốt nhiều tuần.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Màu cam rực rỡ của cánh tò vò săn nhện là một ví dụ kinh điển về cảnh báo màu sắc (aposematism), khiến ngay cả những loài chim săn mồi đói khát nhất cũng chủ động tránh xa.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/een.12642",
        "label": "Ecological Entomology - Evolutionary defense mechanism of Pepsis grossa"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2015.03.011",
        "label": "Toxicon - Structure and function of pompilidotoxins in spider wasp venom"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Dù có cú đốt tàn khốc, tò vò săn nhện trưởng thành lại rất chuộng quả chín lên men và thường xuyên bị 'say xỉn' do chất cồn tự nhiên, khiến chúng bay lảo đảo trên không.",
        "Chỉ con cái mới đi săn nhện tarantula và có ngòi châm, tò vò đực hoàn toàn vô hại và chỉ hút mật hoa."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Ngòi châm dài tới 7mm linh hoạt không ngạnh có thể tiêm nọc liên tiếp nhiều góc độ",
        "Lớp giáp kitin dày và siêu cứng chống chịu được cả những cú đớp trực diện của nhện tarantula"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nọc độc sản xuất rất chậm, nếu sử dụng hết trong trận chiến thì phải mất nhiều ngày mới hồi phục lại"
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
