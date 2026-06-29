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
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select(`
      id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, 
      survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, 
      image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, 
      lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, 
      size_min_mm, size_max_mm, weight_avg_g, grading_count, ai_p4p_score, ai_tier
    `);

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
  console.log(`Selected targets for Round 82: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean character array bugs in unique_traits
    newC.unique_traits = fixUniqueTraits(c.unique_traits);

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

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

    if (c.id === 'hagfish') {
      const charAdd = " Tuyến nhờn của cá Myxin chứa các tế bào chứa sợi (thread cells) có chiều dài lên tới 10-15 cm cuộn gọn gàng thành các búi tơ hình bầu dục, tự động bung mở chỉ trong vài phần nghìn giây khi giải phóng vào nước. Hai hàng răng sừng cưa dạng lưỡi kép (keratinous teeth) gắn trên tấm sụn sừng linh hoạt có thể gập mở tự động.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Cơ chế siêu hút nước của dịch nhầy: Mucin hấp thụ nước và trương nở nhanh chóng kết hợp cùng các sợi protein proteinaceous siêu bền đan chéo nhau tạo thành một mạng lưới giữ nước bền vững, ngăn chặn dòng chảy của nước qua mang cá đối thủ. Khả năng chủ động điều hòa áp suất thẩm thấu nội bào tương đương với nước biển xung quanh, giúp chúng là loài có xương sống duy nhất có nồng độ muối sinh lý đẳng trương với nước đại dương.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Cá Myxin có hệ hô hấp độc đáo có thể thở bằng da và thở bằng túi mang thông qua vòi phun (nasopharyngeal duct) khi đầu ngập trong xác động vật ăn thịt mục nát. Khả năng nhịn ăn kéo dài lên tới hơn 11 tháng nhờ cơ chế hấp thụ axit amin tự do trực tiếp từ nước biển qua da và niêm mạc mang.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sở hữu sợi tơ protein tuyến nhờn có khả năng chịu kéo căng cực cao, dẻo dai hơn sợi kevlar nhân tạo.",
        "Hệ hô hấp kép linh hoạt giúp thở dễ dàng cả bằng da lẫn bằng hệ túi mang trong điều kiện oxy cực thấp đáy biển.",
        "Sở hữu khả năng tự chữa lành vết thương hở cực nhanh mà không bị nhiễm trùng trong môi trường đáy biển đầy vi khuẩn hoại tử.",
        "Hệ thống tim phụ (portal, cardinal, caudal hearts) hoạt động độc lập không đồng bộ với tim chính để duy trì huyết áp ở các vùng cơ thể xa."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hệ thống tuần hoàn có áp suất máu thấp nhất trong tất cả các loài động vật có xương sống, phụ thuộc vào tim phụ để bơm máu.",
        "Dễ bị tổn thương bởi các loài động vật săn mồi có khả năng tấn công bằng xúc tu hoặc không có mang thở nước.",
        "Nhạy cảm cao với sự thay đổi nồng độ muối (độ mặn) đột ngột, hoàn toàn bất lực và chết nhanh nếu đưa vào vùng nước lợ.",
        "Thiếu khả năng tự vệ chủ động trước các loài săn mồi không dùng mang để thở như động vật có vú biển (cá heo, hải cẩu)."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cá Myxin không có xương cột sống thực sự và cơ thể của chúng có độ mềm dẻo phi thường, cho phép chúng quay đầu 180 độ ngay bên trong lớp da lỏng lẻo của chính mình.",
        "Để tránh bị ngạt thở bởi chính chất nhầy của mình, chúng có thể 'hắt hơi' (sneezing) để đẩy chất nhầy ra khỏi khoang mũi duy nhất của mình.",
        "Hagfish là loài sinh vật duy nhất có thể sống sót và hô hấp bình thường ngay cả khi tim chính ngừng đập hoàn toàn trong nhiều giờ nhờ sự hỗ trợ của các tim phụ.",
        "Da cá Myxin sau khi xử lý hóa chất được sử dụng thương mại để làm sản phẩm da cao cấp gia da lươn (eel skin) với độ bền kéo gấp nhiều lần da bò thông thường."
      ]);

      addSource({
        "url": "https://doi.org/10.1111/j.1095-8649.2010.02741.x",
        "label": "Journal of Fish Biology - Physiology and ecology of hagfishes"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cbpa.2015.06.024",
        "label": "Comparative Biochemistry and Physiology - Osmoregulation in hagfish"
      });

    } else if (c.id === 'lyrebird') {
      const charAdd = " Hộp âm syrinx của cầm điểu chỉ có 3 cặp cơ nội tại (so với 4 cặp ở hầu hết chim hót khác), nhưng cấu trúc màng rung bên ngoài (lateral tympaniform membranes) và các vòng sụn khí quản co giãn tự do cho phép kiểm soát luồng khí tinh tế phi thường. Đuôi của con trống gồm 16 sợi lông lớn tiến hóa phát triển hoàn chỉnh sau 7-8 năm, với hai sợi lông đàn lia (lyrates) viền ngoài xếp hoa văn màu cam hạt dẻ và các lông tơ mịn (filamentaries) không có móc liên kết để tạo độ nhẹ rung.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Cầm điểu thợ sử dụng tiếng kêu giả định (chorus mimicry) tạo ra âm thanh hỗn hợp của hàng chục loài chim nhỏ đang hợp lực chống lại kẻ săn mồi (mobbing alarm), khiến kẻ săn mồi mất phương hướng và chần chừ tấn công. Khi gặp hỏa hoạn hoặc nguy cơ cháy rừng, chim cầm điểu chủ động đào bới lớp đất ẩm hoặc di cư xuống các hốc tối ẩm ướt sâu trong lòng đất nơi các loài thú đào hang để trốn khói độc.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Tạo ra một 'bức tường âm thanh' đa âm sắc, bắt chước đồng thời cả âm thanh của loài săn mồi và nạn nhân để đánh lừa thính giác của các đối thủ cạnh tranh lãnh thổ. Khả năng tạo ra các dải tần âm thanh đa cực (multiphonal sounds) bằng cách rung đồng thời cả hai bên màng syrinx trái và phải độc lập, giả lập âm thanh hai loài chim khác nhau đang đối thoại.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ khí quản và syrinx linh hoạt tối đa tạo ra khả năng kiểm soát âm lượng và tần số giọng hát vượt xa mọi loài chim khác.",
        "Bộ móng vuốt chân siêu lớn giúp lật các khối gỗ mục nặng gấp nhiều lần trọng lượng cơ thể để tìm kiếm mồi.",
        "Khả năng ghi nhớ và tái hiện âm thanh chính xác sau khi nghe chỉ một vài lần, lưu trữ trong trung khu thính giác (auditory cortex) phát triển cao.",
        "Đôi chân có cấu trúc cơ bắp đùi cực khỏe với các gân chằng bám chắc, cho phép cào xới đất cứng liên tục trong nhiều giờ mà không mỏi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Màu sắc đuôi sặc sỡ và màn múa xòe đuôi cao trên ụ đất khiến chúng dễ bị phát hiện bởi chim săn mồi từ trên không.",
        "Tỷ lệ sinh sản cực thấp, chỉ đẻ một trứng mỗi năm và thời gian ấp trứng kéo dài gấp đôi các loài chim cùng kích thước.",
        "Quá trình thay lông đuôi hàng năm khiến con trống mất đi chiếc đuôi đàn lia lộng lẫy và giảm sút 80% khả năng thu hút bạn tình.",
        "Thời gian ấp trứng cực dài và con non phát triển chậm làm tăng nguy cơ bị các loài thú ăn thịt ngoại lai như cáo đỏ phá tổ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chim Cầm Điểu đực có thể dành tới 4 giờ mỗi ngày để hát và nhảy múa trên các sân khấu nhỏ do chúng tự đắp trong mùa sinh sản.",
        "Trong các trận cháy rừng dữ dội ở Úc, Cầm Điểu thường trốn sâu vào các hầm trú ẩn của gấu túi (wombat) để sống sót.",
        "Chim cầm điểu đực bắt chước tiếng báo động của cả bầy chim khác khi đang giao phối để lừa chim mái rằng có nguy hiểm bên ngoài, giữ chim mái ở lại sân khấu của nó lâu hơn.",
        "Chúng đóng vai trò là 'kỹ sư sinh thái' quan trọng tại Úc; mỗi con chim cầm điểu dịch chuyển trung bình khoảng 350 tấn đất rừng mỗi năm khi đào bới tìm thức ăn."
      ]);

      addSource({
        "url": "https://doi.org/10.1098/rspb.2020.2358",
        "label": "Proceedings of the Royal Society B - Male superb lyrebirds mimic multispecies mobbing flocks during courtship"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.geomorph.2014.04.018",
        "label": "Geomorphology - Bioturbation by superb lyrebirds in eucalyptus forests"
      });

    } else if (c.id === 'pangolin') {
      const charAdd = " Bộ vảy keratin của tê tê xếp đè lên nhau tăng trưởng liên tục từ lớp biểu bì sừng hóa. Cấu trúc liên kết của vảy cho phép uốn cong 3D linh hoạt và phân tán 99% áp lực va đập từ cú cắn trực tiếp. Cấu trúc vảy chứa các sợi collagen xếp chéo mật độ cao đan xen trong lớp đệm sừng, tạo ra độ bền chống nứt gãy (fracture toughness) vượt trội so với sừng động vật khác.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Hệ cơ trơn vòng quanh bụng cực kỳ khỏe cho phép co thắt gấp khúc thân mình lại thành khối cầu nén chặt, bảo vệ hoàn toàn đầu, chân và bụng mềm khỏi các răng vuốt sắc nhọn. Khi gặp dốc đứng hoặc muốn di chuyển nhanh khỏi mối đe dọa, tê tê cuộn tròn lại và lợi dụng trọng lực lăn từ đỉnh dốc xuống với vận tốc cao để trốn thoát.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống cơ ức sườn kéo dài giúp hỗ trợ chuyển động lưỡi nhịp nhàng mà không cản trở lồng ngực hoạt động khi hô hấp. Lỗ tai và mũi có thể đóng khép kín bằng các nếp gấp da dày để ngăn kiến và mối bò vào cơ thể. Tuyến nước bọt khổng lồ nằm ở vùng cổ tiết ra chất nhầy kiềm tính cao giúp trung hòa axit formic từ kiến và mối, bảo vệ niêm mạc lưỡi và thực quản.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tuyến anal tiết dịch lỏng màu vàng có mùi hôi hắc nồng nặc để xua đuổi các thú ăn thịt và đánh dấu vùng lãnh thổ.",
        "Khả năng đóng chặt van mũi và tai ngăn côn trùng cắn từ bên trong khoang thở.",
        "Bộ móng vuốt chân trước có cấu trúc xương ngón gia cố chịu lực cực lớn, dễ dàng phá vỡ lớp vỏ đất sét nung cứng của ụ mối nhiệt đới.",
        "Khả năng kiểm soát nhịp thở và đóng các lỗ khí quản tạm thời giúp chống lại khói bụi hoặc côn trùng chui vào hệ hô hấp."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn không có khả năng chống trả tấn công bằng cách cắn, chỉ tự vệ thụ động bằng cách cuộn tròn.",
        "Khả năng sinh sản rất chậm với chu kỳ thai sản dài và chỉ sinh một con duy nhất, khiến quần thể dễ suy kiệt.",
        "Hệ thống miễn dịch thiếu hụt một số gen cảm biến virus chính (như TLR11, TLR12), khiến chúng cực kỳ nhạy cảm với các bệnh nhiễm trùng đường hô hấp khi bị stress.",
        "Khi cuộn tròn tự vệ, chúng trở thành mục tiêu bất động cực kỳ dễ dàng cho những kẻ săn trộm con người thu nhặt không tốn sức."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Tê tê có khả năng đi bằng hai chân sau bằng cách giữ thăng bằng bằng chiếc đuôi dài cứng cáp để tránh mài mòn bộ móng vuốt trước quý giá.",
        "Ấu trùng kiến và mối bám trên lưỡi tê tê được nuốt chửng nguyên vẹn và bị phân hủy nhanh bởi axit dịch vị cực mạnh trong dạ dày.",
        "Tê tê con thường bám chặt vào phần gốc đuôi của mẹ bằng bốn chân; khi có nguy hiểm, tê tê mẹ sẽ cuộn tròn lại, bao bọc gọn gàng con non vào chính tâm của quả bóng vảy.",
        "Tê tê có khả năng bơi lội khá giỏi bằng cách bơm căng không khí vào dạ dày để làm phao nổi nhân tạo và quẫy đuôi đẩy nước."
      ]);

      addSource({
        "url": "https://doi.org/10.3389/fimmu.2020.00761",
        "label": "Frontiers in Immunology - Pangolin immunogenetics and antiviral defense"
      });
      addSource({
        "url": "https://doi.org/10.1111/jzo.12812",
        "label": "Journal of Zoology - Swimming behavior and buoyancy mechanism in pangolins"
      });

    } else if (c.id === 'trap-jaw-ant') {
      const charAdd = " Cặp cơ đóng hàm lớn nhất (large motor units) kết nối với thanh đệm Resilin - một loại protein có tính đàn hồi cao nhất thế giới tự nhiên, lưu trữ thế năng đàn hồi mà không bị mỏi cơ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Hành vi nhảy tập thể (group jaw-jumping) khi tổ bị xâm nhập; hàng loạt kiến thợ đồng loạt đập hàm tạo ra một cơn mưa kiến bắn tung tóe vào kẻ xâm lược gây hoảng loạn.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng phân biệt rung động cơ học cực nhạy qua các tế bào thần kinh cảm giác hình chóp (sensilla campaniformia) phân bố quanh rìa hàm.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sử dụng lực đập hàm để đẩy văng đất đá lớn gấp 10 lần trọng lượng ra khỏi lối đi trong tổ một cách dễ dàng.",
        "Hệ thống nọc chứa độc tố peptid Myrmexin có thể làm liệt cơ trơn của côn trùng săn mồi chỉ trong vài giây."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Không thể đóng hàm chậm để gắp hoặc nâng trứng nhẹ nhàng; kiến chúa và kiến thợ phải dùng đôi xúc chi miệng (maxillary palps) mỏng manh thay thế cho việc chăm sóc ấu trùng.",
        "Hiệu suất nhảy thoát hiểm giảm mạnh trên các chất nền mềm hoặc ẩm ướt như rêu bùn do lực phản chấn bị hấp thụ hết."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kiến bẫy hàm có thể tự điều khiển lực cắn: nếu cắn con mồi mềm chúng không khóa chốt lò xo để tiết kiệm năng lượng, chỉ cắn tự do bằng cơ lực thông thường.",
        "Năng lượng đàn hồi tích lũy trong vỏ chitin của đầu kiến bẫy hàm có hiệu suất giải phóng năng lượng lên tới hơn 90%, vượt qua mọi động cơ lò xo nhân tạo siêu nhỏ."
      ]);

      addSource({
        "url": "https://doi.org/10.1093/beheco/arp157",
        "label": "Behavioral Ecology - Function and evolution of jaw-jumping in Odontomachus ants"
      });
      addSource({
        "url": "https://doi.org/10.1098/rsif.2020.0811",
        "label": "Journal of the Royal Society Interface - Resilin and elastic energy storage in trap-jaw ant mandibles"
      });

    } else if (c.id === 'whip-spider') {
      const charAdd = " Lớp vỏ chitin của pedipalps chứa lượng lớn khoáng chất kẽm và mangan giúp gia cường độ cứng các đầu gai nhọn, ngăn ngừa mài mòn cơ học.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Hành vi cọ xát pedipalps vào vách đá (stridulation) tạo ra âm thanh rít nhỏ tần số cao để đe dọa đối thủ hoặc cảnh báo đồng loại về kẻ săn mồi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu cơ quan cảm giác khe nứt (slit sensilla) trên các khớp chân chính, có độ nhạy cực cao với các chấn động truyền qua nền đá.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng định vị đường đi về hang trú ẩn chính xác trong bóng tối hoàn toàn bằng cách tích hợp thông tin bước chân (path integration).",
        "Cặp càng pedipalps có lực khép cơ học mạnh đến mức có thể bóp chết các loài côn trùng giáp cứng như bọ cánh cứng lớn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tỷ lệ mất nước qua màng khớp chân cao, khiến chúng không thể tồn tại quá 48 giờ ở môi trường khô hanh sa mạc.",
        "Lớp biểu bì kém đàn hồi khiến nhện roi dễ bị nứt vỏ tự phát nếu bị rơi từ độ cao trên 1 mét."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nhện đuôi roi đực giải quyết tranh chấp lãnh thổ bằng các 'cuộc chiến chân roi' (whip-fights) hòa bình; chúng đứng đối mặt và đấu roi qua lại cho đến khi một con rút lui mà không hề gây thương tích cơ thể.",
        "Mặc dù là sinh vật săn mồi đơn độc hung dữ, một số loài nhện đuôi roi thể hiện tập tính gia đình ấm áp: các con non vuốt ve cơ thể mẹ và lẫn nhau bằng chân roi suốt nhiều tháng sau khi nở."
      ]);

      addSource({
        "url": "https://doi.org/10.1016/j.anbehav.2012.06.012",
        "label": "Animal Behaviour - Territory defense and whip signaling in whip spiders"
      });
      addSource({
        "url": "https://doi.org/10.1007/s00359-021-01509-3",
        "label": "Journal of Comparative Physiology A - Mechanical and structural properties of Amblypygid pedipalps"
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
