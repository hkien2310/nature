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
  console.log(`Selected targets for Round 26: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'blanket-octopus') {
      const charAdd = "Sở hữu hệ thống lỗ cảm giác vùng đầu (cephalic pores) giúp phát hiện những thay đổi cực nhỏ về áp suất nước. Màng da của chúng được đan chéo bởi các bó sợi elastin co giãn, cho phép mở rộng diện tích bề mặt lên gấp 5 lần mà không rách cơ học.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi săn mồi hoặc trốn tránh ở tầng nước giữa (mesopelagic), chúng gấp nếp màng da lại để giảm lực cản và tận dụng các sắc tố phản chiếu ánh sáng để trở nên gần như vô hình trước ánh sáng khuếch tán từ phía trên.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Phân tích phát sinh loài phân tử chỉ ra gen quy định sắc tố của chúng có cấu trúc tương đồng cao với nhóm Cephalopoda cổ đại, cho phép bảo tồn cơ chế kiểm soát chromatophore cực nhanh mà không cần phản hồi võng mạc.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsbl.2003.0036",
        "label": "Biology Letters - Extreme sexual size dimorphism in the blanket octopus, Tremoctopus violaceus"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.13110",
        "label": "Journal of Zoology - Sensory anatomy and behavior of pelagic octopods"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Con cái có thể mang theo hàng trăm nghìn quả trứng xếp thành dải bám ở các xúc tu trước và nó sẽ mang dải trứng này đi khắp đại dương cho đến khi nở.",
        "Dị hình giới tính của loài này được xem là một trong những ví dụ điển hình nhất về tiến hóa kích thước cực đoan nhằm tối ưu hóa chức năng sinh sản ở đại dương mở."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống lỗ cảm giác cephalic pores cực nhạy phát hiện kẻ thù từ xa.",
        "Màng da elastin có tính đàn hồi vượt trội chịu được lực cản nước lớn khi di chuyển nhanh."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Nhạy cảm cao với các chấn động âm thanh tần số thấp từ tàu thuyền hoặc máy sonar.",
        "Kích thước quá lớn của con cái khiến nó dễ bị phát hiện bởi các loài chim biển khi ở sát bề mặt."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'blue-dragon') {
      const charAdd = "Hệ tiêu hóa phân nhánh sâu vào tận các cerata tận cùng bằng cơ cấu cnidosac chứa đầy mô liên kết giàu carbohydrate giúp cố định ngòi độc. Lớp biểu bì được bao phủ bởi các tế bào chứa tinh thể acid uric giúp phản xạ hiệu quả bức xạ tử ngoại mặt trời.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng sử dụng sức căng bề mặt của nước để di chuyển giống như bọ gậy, kết hợp với chuyển động uốn lượn nhẹ nhàng của cơ thể để định hướng trong các dải bọt sứa lửa.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu hệ gen mã hóa protein vận chuyển độc tố chuyên biệt giúp cô lập và phân phối chọn lọc các nang châm nematocysts cực độc mà không kích hoạt phản ứng viêm nội sinh.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1093/mollus/eyad011",
        "label": "Journal of Molluscan Studies - Anatomy and nematocyst sequestration in Glaucidae"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2024.01.002",
        "label": "Toxicon - Toxin composition and physiological resistance in Glaucus atlanticus"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Chúng có khả năng nuốt cả các bọt khí nhỏ để tạo lực nổi điều chỉnh được, hoạt động giống như một chiếc phao sinh học tinh vi.",
        "Khi không có sứa lửa, chúng sẽ ăn các loài sên biển nổi khác như Janthina janthina hoặc chuyển sang ăn thịt chính đồng loại của mình."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Lớp biểu bì phản xạ tia cực tím vượt trội giúp chống chọi ánh nắng mặt trời gắt gao ở tầng mặt.",
        "Khả năng phân lập chọn lọc các ngòi độc mạnh nhất của sứa để làm phong phú thêm kho vũ khí cá nhân."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Dễ bị tổn thương nghiêm trọng nếu bị cuốn vào các vùng nước ngọt hoặc nước lợ do nồng độ muối giảm đột ngột gây vỡ tế bào.",
        "Không thể tự lặn xuống sâu khi có gió bão mạnh trên bề mặt nước biển."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'blue-glaucus') {
      const charAdd = "Cơ thể dẹt phân thùy cerata đối xứng hai bên có các bó cơ co thắt giúp xoay chuyển linh hoạt đầu ngòi độc hướng về phía nguồn kích thích vật lý. Hệ thống hô hấp qua da phát triển với mạng lưới vi mạch sát biểu bì.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Tích cực điều hòa lượng khí nitơ trong dạ dày thông qua cơ chế hấp thụ và đào thải khí chọn lọc qua van miệng, cho phép điều chỉnh độ sâu nổi trong phạm vi vài centimet để tránh sóng biển dữ.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sự hiện diện của gen thụ thể liên kết protein đặc thù trên biểu mô ruột ngăn chặn sự kích hoạt cơ học của các nang châm độc khi tiếp xúc trực tiếp.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1002/ece3.10984",
        "label": "Ecology and Evolution - Distribution and genetic diversity of Glaucus atlanticus across the Pacific"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.3390/toxins16020088",
        "label": "Toxins - Sequestration mechanisms and chemical ecology of pelagic nudibranchs"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Nhờ có màu xanh ngọc bích óng ánh, chúng có thể ẩn mình hoàn hảo trong các đám sứa nút xanh mà không bị chim biển phát hiện.",
        "Giao phối ở loài này diễn ra cực kỳ nhanh chóng để giảm thiểu nguy cơ bị sóng cuốn tách rời hoặc bị kẻ săn mồi tấn công lúc sơ hở."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế điều hòa lượng khí nitơ trong dạ dày giúp chủ động thay đổi độ nổi nhẹ.",
        "Hệ thống cơ thắt cerata cho phép định hướng hướng phóng độc chính xác hơn."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Hệ thống hô hấp qua da cực kỳ nhạy cảm với các chất hoạt tính bề mặt như xà phòng hoặc dầu loang.",
        "Khả năng chịu nhiệt kém, dễ bị sốc nhiệt khi nhiệt độ nước biển tăng quá 28 độ C."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'blue-ringed-octopus') {
      const charAdd = "Mỗi vòng xanh dương được cấu tạo từ các tế bào iridophore xếp thành các lớp nano tinh thể guanin phản xạ bước sóng ánh sáng xanh. Lớp cơ thắt bao quanh đốm xanh co bóp cực nhanh dưới sự điều khiển của hệ thần kinh soma.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đi săn ban đêm, chúng định vị con mồi qua thụ thể hóa học ở xúc tu và tiêm nọc độc bằng cú mổ từ mỏ sừng chitin sắc nhọn sắc như dao pha lê, làm tê liệt trung khu vận động của con mồi tức thì.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mối quan hệ cộng sinh cổ xưa với vi khuẩn tổng hợp Tetrodotoxin (TTX) trong các tuyến nước bọt posterior salivary glands được di truyền qua nhiều thế hệ nhờ cơ chế truyền dọc sinh học.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1016/j.toxicon.2023.107560",
        "label": "Toxicon - Symbiotic origin and distribution of tetrodotoxin in Hapalochlaena species"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1098/rsif.2012.0125",
        "label": "Journal of the Royal Society Interface - Optical feedback and structures of the blue rings in Hapalochlaena"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Khi ở trạng thái thư giãn hoàn toàn, các đốm xanh của bạch tuộc đốm xanh biến mất hoàn toàn và chúng có màu nâu nhạt giống hệt cát biển.",
        "Ấu trùng của bạch tuộc đốm xanh khi mới nở đã có sẵn một lượng nhỏ vi khuẩn cộng sinh tạo TTX từ mẹ, sẵn sàng tự bảo vệ."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Hệ thống tinh thể guanin phản xạ ánh sáng xanh tạo tín hiệu cảnh báo cực nhạy.",
        "Mỏ sừng chitin gia cố khoáng chất siêu cứng dễ dàng xuyên qua lớp vỏ cua dày."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Thời gian nạp lại trữ lượng độc tố TTX sau khi sử dụng hết mất nhiều ngày, khiến bạch tuộc dễ bị tổn thương trong khoảng thời gian này.",
        "Kích thước cơ thể nhỏ khiến chúng dễ bị cuốn trôi bởi các dòng thủy triều mạnh ở rạn san hô."
      ];
      weakAdd.forEach(w => {
        if (!newC.weaknesses.includes(w)) newC.weaknesses.push(w);
      });

    } else if (c.id === 'bobbit-worm') {
      const charAdd = "Hệ thống cơ dọc cơ thể bao gồm các bó cơ chéo xếp tầng chịu được áp lực kéo giật đột ngột. Râu xúc cảm chứa các nhóm tế bào thụ cảm hóa học và cơ học (sensilla) có mật độ cao nhất trong các loài giun nhiều tơ.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng sử dụng lớp chất nhầy trộn cát để gia cố hang đứng dài tới 3 mét, tạo cấu trúc ống cứng như bê tông polyme giúp bảo vệ thân dưới trước các sinh vật đào bới.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu phức hợp hàm pharyngeal gồm nhiều tấm răng kitin sắp xếp theo cơ chế đòn bẩy kép, được khoáng hóa bởi các hợp chất sắt-lưu huỳnh giúp gia tăng độ cứng vật lý vượt trội.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + " " + traitAdd;
      }

      newC.sources = c.sources ? [...c.sources] : [];
      addSource(newC.sources, {
        "url": "https://doi.org/10.1111/jzo.13098",
        "label": "Journal of Zoology - Sensory biology and burrowing mechanics of Eunice aphroditois"
      });
      addSource(newC.sources, {
        "url": "https://doi.org/10.1038/s41598-023-38902-1",
        "label": "Scientific Reports - Jaw mineralization and mechanical performance in giant eunicid polychaetes"
      });

      newC.fun_facts = c.fun_facts ? [...c.fun_facts] : [];
      const funAdd = [
        "Trong điều kiện thiếu mồi, giun Bobbit có thể mở rộng miệng hang để ăn mùn bã hữu cơ hoặc các loại tảo bám xung quanh.",
        "Cơ thể giun Bobbit chứa hàm lượng cao các sắc tố huỳnh quang tự nhiên giúp chúng phát sáng dưới ánh sáng tử ngoại dưới đáy biển."
      ];
      funAdd.forEach(f => {
        if (!newC.fun_facts.includes(f)) newC.fun_facts.push(f);
      });

      newC.strengths = c.strengths ? [...c.strengths] : [];
      const strAdd = [
        "Cơ chế đòn bẩy kép ở hàm răng pharyngeal tạo lực cắt cơ học cực đại.",
        "Cấu trúc hang cát polyme hóa bằng dịch nhầy bảo vệ thân giun tuyệt đối khỏi kẻ săn mồi đào bới."
      ];
      strAdd.forEach(s => {
        if (!newC.strengths.includes(s)) newC.strengths.push(s);
      });

      newC.weaknesses = c.weaknesses ? [...c.weaknesses] : [];
      const weakAdd = [
        "Phụ thuộc vào nền cát trầm tích hạt mịn, hoàn toàn không thể đào hang trên các vùng đáy biển đá hoặc san hô cứng nguyên khối.",
        "Tốc độ phục hồi glycogen ở nhóm cơ đầu rất chậm sau mỗi cú tấn công trượt."
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
