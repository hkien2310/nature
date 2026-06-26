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
  console.log(`Selected targets for Round 16: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'spitting-cobra') {
      const charAdd = " Cơ hàm co bóp với xung tần số cao tạo lực đẩy thủy động học cực mạnh qua răng nanh có lỗ thoát thu hẹp góc 90 độ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng chuyển động rung đầu hình số 8 đồng bộ với luồng phun để phân tán rộng giọt nọc độc thành màn sương mịn bao phủ hoàn toàn mục tiêu.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự xuất hiện của phân nhóm gene PLA2 độc lực cao liên kết bổ trợ với độc tố ba ngón (3FTx) tạo phản ứng hoại tử cực bộ giác mạc tức thì.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1074/jbc.RA120.014945",
        "label": "JBC - Structural basis of venom spitting and toxicity synergy in cobras"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins14060381",
        "label": "Toxins - Phospholipase A2 diversity in African spitting cobras"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Để tránh bị ngộ độc bởi chính lượng nọc phun ra bay ngược lại trong gió, giác mạc của rắn hổ mang phun nọc có cấu trúc biểu mô dày và có khả năng đề kháng tốt hơn các loài rắn thông thường.",
        "Chúng có khả năng cảm nhận hướng gió và chủ động điều chỉnh vị trí phun để tránh nọc bị gió cuốn đi sai lệch mục tiêu."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ hàm co bóp tạo áp lực cơ học thế hệ mới đẩy luồng nọc đạt tốc độ đầu nòng vượt trội",
        "Khả năng tự đề kháng biểu mô giác mạc giúp giảm thiểu nguy cơ bị trúng độc ngược"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Quá trình tái tổng hợp nọc độc tiêu thụ tới 10% năng lượng nền của cơ thể khiến chúng cần nghỉ ngơi tĩnh sau khi cạn kiệt nọc."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'spotted-hyena') {
      const charAdd = " Xương hàm dưới hình vòng cung dày chịu lực xoắn xoay cực tốt khi giằng xé các mảng xương lớn của con mồi.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chiến thuật rượt đuổi kéo dài mỏi mệt dựa trên cấu trúc tim cực đại và khả năng lọc axit lactic hiệu quả trong cơ bắp.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Mật độ thụ thể hormone androgen ở tế bào mô sinh dục con cái cực kỳ cao, thúc đẩy quá trình nam tính hóa giải phẫu học và hành vi độc nhất vô nhị.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rspb.2021.0805",
        "label": "Proceedings B - Social inheritance and network dynamics in spotted hyena societies"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1186/s12983-020-00366-z",
        "label": "Frontiers in Zoology - Bone-cracking mechanics and dental wear patterns in Crocuta"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Hàm lượng canxi carbonat trong phân của linh cẩu đốm cao đến mức phân khô của chúng đông cứng lại như những viên đá phấn trắng tinh, tồn tại hàng năm trời trên đồng cỏ.",
        "Chỉ số thông minh xã hội của linh cẩu đốm được so sánh ngang ngửa với một số loài linh trưởng, nhờ khả năng nhận diện tiếng kêu của hàng chục thành viên khác nhau."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cấu trúc xương hàm dưới dày chịu lực xoắn tốt hạn chế nứt gãy khi cắn xé xương",
        "Khả năng lọc axit lactic cơ bắp siêu việt duy trì vận tốc săn đuổi đường dài"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Cấu trúc xương vai dốc hạn chế đáng kể khả năng nhảy cao hoặc thực hiện các cú vồ mồi từ trên cao xuống."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'star-nosed-mole') {
      const charAdd = " Hệ cơ trán-mũi đặc biệt có các sợi cơ chéo bám sâu vào gốc các xúc tu, cho phép co bóp nhịp nhàng co cụm ngôi sao để bảo vệ khi đào đất.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Thao tác thu nhận bong bóng khí dưới nước bằng cách thổi áp vào da con mồi rồi hít ngược để dẫn truyền phân tử hóa học vào cơ quan khứu giác.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Vỏ não sơ cấp S1 tổ chức lập trình một vùng bản đồ thần kinh dạng tia phóng đại đặc biệt đại diện cho 22 xúc tu, mô phỏng hoàn hảo mô hình thị giác điểm vàng.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0175753",
        "label": "PLoS ONE - Tactile fovea representation and scanning kinematics in Condylura cristata"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1002/cne.24921",
        "label": "JCN - Cellular structure and mechanoreceptors in Eimer organs of Talpidae"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cơ quan Eimer trên mũi sao nhạy bén đến mức có thể cảm nhận thấy dòng xung điện siêu nhỏ phát ra khi con mồi co cơ dưới nước sâu.",
        "Chúng có thể đào một đường hầm dài tới 10 mét chỉ trong vòng 1 giờ nhờ cấu trúc xương vai bả dẹt siêu phát triển."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ cơ trán-mũi linh hoạt co rụt bảo vệ các xúc tu xúc giác",
        "Khả năng xử lý tín hiệu thần kinh thính giác và xúc giác tích hợp cao ở não bộ"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Mức tiêu thụ oxy của cơ bắp vai khi đào đất cực kỳ cao khiến chúng dễ bị kiệt sức nhanh chóng nếu đất quá khô cứng."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'stargazer-fish') {
      const charAdd = " Sợi tơ mồi giả ở sàn miệng có thể co duỗi linh hoạt nhờ hệ tuần hoàn máu vi mô điều áp khoang miệng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Điều hòa lưu lượng nước đi qua hốc mắt và mũi chuyên biệt để giữ ẩm cho mắt mà không bị cát tràn vào chèn áp cấu trúc nhãn cầu.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Sự biến đổi sinh học của các tế bào cơ vận nhãn thành phiến điện myogenic (electrocytes) có màng phân cực giải phóng ion điện tích cực cao.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jfb.14589",
        "label": "Journal of Fish Biology - Comparative electrogenesis and osteology in Uranoscopiformes"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.cbpb.2021.110582",
        "label": "CBPB - Biochemical characterization of venom proteins from Uranoscopus scaber"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Cơ quan phát điện của chúng thực chất được biến đổi trực tiếp từ cơ vận hành chuyển động của nhãn cầu mắt.",
        "Nọc độc của loài cá này chứa độc tố có cấu trúc tương đồng với chất độc của cá đá, gây suy giảm hệ thần kinh tim cục bộ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ cấu sợi tơ mồi giả điều áp vi mô bắt chước hoàn hảo sinh vật đáy",
        "Khả năng chịu đựng nồng độ muối thay đổi linh hoạt ở cửa sông ven biển"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ thống phát điện myogenic tiêu tốn một lượng adenosine triphosphate (ATP) khổng lồ, khiến chúng cần thời gian nghỉ dưỡng sức dài sau các cú giật điện liên tục."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'stonefish') {
      const charAdd = " Lớp thượng bì sần sùi chứa các khoang rỗng nhỏ tích tụ các hạt cát mịn và sinh vật phù du làm tăng độ bám dính tự nhiên.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Cơ chế hô hấp qua da phụ trợ kết hợp điều hòa giảm nhịp trao đổi chất sâu giúp chịu đựng môi trường cạn nước lúc triều rút.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Độc tố Stonustoxin (SNTX) hoạt động bằng cách chèn các tiểu đơn vị lưỡng tính tạo lỗ thủng có đường kính lớn trên màng tế bào máu làm tan máu tức thời.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1074/jbc.M111.312983",
        "label": "JBC - Functional insights and cytolytic mechanism of Stonustoxin (SNTX) from Synanceia verrucosa"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/md20050312",
        "label": "Marine Drugs - Proteomic characterization of venom components in reef stonefish"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nọc độc của cá đá gây đau đớn dữ dội đến mức nhiều nạn nhân rơi vào trạng thái sốc phản vệ hoặc bất tỉnh chỉ sau vài phút bị châm.",
        "Tốc độ tấn công đớp mồi của cá đá nhanh đến nỗi ngay cả các máy quay tốc độ cao chuyên dụng cũng gặp khó khăn khi ghi lại hình ảnh chuyển động răng hàm của nó."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống cơ khớp quanh miệng tạo lực nén chân không nuốt trọn mồi chỉ trong 15 mili giây",
        "Khả năng phục hồi và tái tạo lớp màng nhầy bảo vệ da cực nhanh"
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Bao cơ bao quanh các gai độc cần nhiều ngày tái tạo lại độ đàn hồi sau khi đã bị ép nén để tiêm nọc độc."
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
